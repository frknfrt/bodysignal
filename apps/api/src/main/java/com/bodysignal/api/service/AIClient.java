package com.bodysignal.api.service;

import com.bodysignal.api.domain.AIAnalysis;
import com.bodysignal.api.domain.DailyRecord;
import com.bodysignal.api.domain.Exercise;
import com.bodysignal.api.domain.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AIClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    private static final String GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.3-70b-versatile";
    private static final String OLLAMA_URL = "http://localhost:11434/api/generate";

    public AnalysisResult getAnalysis(DailyRecord record, double recoveryScore, User user, List<AIAnalysis> recentHistory) {

        // 1. Uyku süresi
        double sleepHours = 0;
        try {
            LocalTime sleep = LocalTime.parse(record.getSleepTime());
            LocalTime wake  = LocalTime.parse(record.getWakeUpTime());
            long minutes = Duration.between(sleep, wake).toMinutes();
            if (minutes < 0) minutes += 24 * 60L;
            sleepHours = Math.round(minutes / 60.0 * 10) / 10.0;
        } catch (Exception ignored) {}

        // 2. Egzersiz formatı
        String exerciseLines = "  - No workout data";
        try {
            List<Exercise> exercises = record.getWorkout().getExercises();
            if (exercises != null && !exercises.isEmpty()) {
                exerciseLines = exercises.stream()
                        .map(e -> String.format("  - %s: %.0fkg x %dset x %drep, RPE: %d",
                                e.getName()       != null ? e.getName()       : "Unknown",
                                e.getWeight()     != null ? e.getWeight()     : 0.0,
                                e.getSets()       != null ? e.getSets()       : 0,
                                e.getRepCount()   != null ? e.getRepCount()   : 0,
                                e.getLastSetRpe() != null ? e.getLastSetRpe() : 0))
                        .collect(Collectors.joining("\n"));
            }
        } catch (Exception ignored) {}

        // 3. Profil & geçmiş
        String profileSection = buildProfileSection(user, record.getMorningWeight());
        String historySection = buildHistorySection(recentHistory);

        // 4. Prompt
        String prompt = String.format(
                "You are a tough but constructive fitness coach. " +
                "Respond ONLY with a valid JSON object — no markdown, no explanation, just the JSON.\n\n" +
                "IMPORTANT: Respond in Turkish. Use proper Turkish characters: " +
                "ç, ş, ğ, ü, ö, ı, İ, Ğ, Ş, Ç, Ö, Ü. " +
                "Do not use ASCII substitutes.\n\n" +
                "%s\n" +
                "%s" +
                "Today's data:\n" +
                "- Current body weight: %s kg\n" +
                "- Sleep: %.1f hours (bedtime %s, wake-up %s)\n" +
                "- Recovery score: %.0f / 100  (0-39 critical, 40-69 moderate, 70-100 optimal)\n" +
                "- Workout:\n%s\n\n" +
                "Return this exact JSON structure (all values in Turkish with proper Turkish characters):\n" +
                "{\n" +
                "  \"generalComment\": \"<2-sentence overall status assessment>\",\n" +
                "  \"strength\": \"<1-sentence: what the athlete did well today>\",\n" +
                "  \"improvement\": \"<1-sentence: the single most important thing to improve>\",\n" +
                "  \"tomorrowSuggestion\": \"<1-sentence: specific action for tomorrow>\"\n" +
                "}\n\n" +
                "Rules: recovery < 40 → rest advice; RPE >= 9 & sleep < 6h → overtraining warning; score >= 70 → motivate.",
                profileSection, historySection,
                record.getMorningWeight(), sleepHours,
                record.getSleepTime(), record.getWakeUpTime(),
                recoveryScore, exerciseLines
        );

        // 5. Groq varsa Groq, yoksa Ollama
        if (groqApiKey != null && !groqApiKey.isBlank()) {
            return callGroq(prompt);
        } else {
            return callOllama(prompt);
        }
    }

    // ─── Groq (OpenAI format) ─────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private AnalysisResult callGroq(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("application", "json", StandardCharsets.UTF_8));
        headers.setBearerAuth(groqApiKey);
        headers.setAcceptCharset(List.of(StandardCharsets.UTF_8));

        Map<String, Object> body = Map.of(
                "model", GROQ_MODEL,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "max_tokens", 600
        );

        try {
            Map<String, Object> response = restTemplate.postForObject(
                    GROQ_URL, new HttpEntity<>(body, headers), Map.class);
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String raw = (String) message.get("content");
            raw = decodeUnicodeEscapes(raw);
            return parseResult(raw);
        } catch (Exception e) {
            e.printStackTrace();
            return fallback("Groq analizi başarısız oldu. Veriler kaydedildi.");
        }
    }

    private String decodeUnicodeEscapes(String input) {
        if (input == null || !input.contains("\\u")) return input;
        Pattern p = Pattern.compile("\\\\u([0-9a-fA-F]{4})");
        Matcher m = p.matcher(input);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            m.appendReplacement(sb, String.valueOf((char) Integer.parseInt(m.group(1), 16)));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    // ─── Ollama fallback ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private AnalysisResult callOllama(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "model", "llama3.2",
                "prompt", prompt,
                "stream", false
        );

        try {
            Map<String, Object> response = restTemplate.postForObject(
                    OLLAMA_URL, new HttpEntity<>(body, headers), Map.class);
            String raw = (String) response.get("response");
            return parseResult(raw);
        } catch (Exception e) {
            e.printStackTrace();
            return fallback("Analiz şu an yapılamıyor. Verilerin kaydedildi, antrenmana odaklan!");
        }
    }

    // ─── JSON parser ──────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private AnalysisResult parseResult(String raw) {
        if (raw == null || raw.isBlank()) return fallback("Yanıt alınamadı.");

        String json = extractJson(raw);
        if (json != null) {
            try {
                Map<String, String> map = objectMapper.readValue(json, Map.class);
                AnalysisResult r = new AnalysisResult();
                r.setGeneralComment(    map.getOrDefault("generalComment",    "").trim());
                r.setStrengthPoint(     map.getOrDefault("strength",          "").trim());
                r.setImprovementPoint(  map.getOrDefault("improvement",       "").trim());
                r.setTomorrowSuggestion(map.getOrDefault("tomorrowSuggestion","").trim());
                if (!r.getGeneralComment().isEmpty() || !r.getStrengthPoint().isEmpty()) return r;
            } catch (Exception ignored) {}
        }

        return fallback(raw.trim());
    }

    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end   = text.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return null;
    }

    private AnalysisResult fallback(String message) {
        AnalysisResult r = new AnalysisResult();
        r.setGeneralComment(message);
        r.setStrengthPoint("");
        r.setImprovementPoint("");
        r.setTomorrowSuggestion("");
        return r;
    }

    // ─── Geçmiş bağlamı ──────────────────────────────────────────────────────

    private String buildHistorySection(List<AIAnalysis> history) {
        if (history == null || history.isEmpty()) return "";

        StringBuilder sb = new StringBuilder("Recent history:\n");
        LocalDate today = LocalDate.now();

        for (AIAnalysis a : history) {
            if (a.getCreatedAt() == null || a.getRecoveryScore() == null) continue;
            long daysAgo  = ChronoUnit.DAYS.between(a.getCreatedAt().toLocalDate(), today);
            double score  = a.getRecoveryScore();
            String status = score >= 70 ? "POSITIVE" : score < 40 ? "PLATEAU" : "STABLE";
            String when   = daysAgo == 0 ? "today" : daysAgo == 1 ? "1 day ago" : daysAgo + " days ago";
            sb.append(String.format("- %s: score %.0f, %s\n", when, score, status));
        }

        List<AIAnalysis> valid = history.stream()
                .filter(a -> a.getRecoveryScore() != null)
                .toList();
        if (valid.size() >= 2) {
            double latest = valid.get(0).getRecoveryScore();
            double oldest = valid.get(valid.size() - 1).getRecoveryScore();
            double diff   = latest - oldest;
            String trend  = diff > 5 ? "improving" : diff < -5 ? "declining" : "stable";
            sb.append("Trend: ").append(trend).append("\n");

            if (diff < -10)
                sb.append("Warning: significant score decline over recent sessions.\n");

            boolean hadPlateau = valid.stream().anyMatch(a -> a.getRecoveryScore() < 40);
            if (hadPlateau)
                sb.append("Note: athlete had at least one critical recovery session recently.\n");
        }

        sb.append("\n");
        return sb.toString();
    }

    // ─── Profil bölümü ───────────────────────────────────────────────────────

    private String buildProfileSection(User user, Double todayWeight) {
        if (user == null) {
            return "Athlete Profile:\n- Profile incomplete, give general advice\n";
        }

        boolean hasBasic = user.getHeight() != null && user.getAge() != null;
        if (!hasBasic) {
            return "Athlete Profile:\n- Profile incomplete, give general advice\n";
        }

        StringBuilder out = new StringBuilder("Athlete Profile:\n");

        // Line 1 — fiziksel
        StringBuilder line1 = new StringBuilder("- ");
        line1.append(user.getAge()).append(" year old");
        if (user.getGender() != null)
            line1.append(" ").append("Erkek".equals(user.getGender()) ? "male" : "female");
        line1.append(", ").append(user.getHeight()).append("cm");
        Double bodyWeight = todayWeight != null ? todayWeight : user.getCurrentWeight();
        if (bodyWeight != null) line1.append(", ").append(bodyWeight).append("kg");
        if (user.getTargetWeight() != null) {
            line1.append(", target: ").append(user.getTargetWeight()).append("kg");
            if (bodyWeight != null) {
                double gap = bodyWeight - user.getTargetWeight();
                if (Math.abs(gap) > 0.5)
                    line1.append(" (").append(gap > 0 ? "needs to lose " : "needs to gain ")
                         .append(String.format("%.1f", Math.abs(gap))).append("kg)");
            }
        }
        out.append(line1).append("\n");

        // Line 2 — hedef
        if (user.getGoalType() != null) {
            out.append("- Goal: ").append(mapGoal(user.getGoalType())).append("\n");
        }

        // Line 3 — antrenman sıklığı + deneyim
        StringBuilder line3 = new StringBuilder("- Training: ");
        if (user.getWeeklyWorkoutDays() != null) {
            line3.append(user.getWeeklyWorkoutDays()).append(" days/week");
        } else if (user.getActivityLevel() != null && !user.getActivityLevel().isBlank()) {
            line3.append(mapActivity(user.getActivityLevel()));
        }
        if (user.getExperienceLevel() != null) {
            if (line3.length() > "- Training: ".length()) line3.append(", ");
            line3.append(mapExperience(user.getExperienceLevel())).append(" level");
        }
        if (line3.length() > "- Training: ".length())
            out.append(line3).append("\n");

        // Line 4 — tercih
        if (user.getPreferredWorkoutType() != null) {
            out.append("- Preference: ").append(mapWorkoutType(user.getPreferredWorkoutType())).append("\n");
        }

        return out.toString();
    }

    private String mapGoal(String goal) {
        return switch (goal) {
            case "Kas Kazan"        -> "muscle gain";
            case "Yağ Yak"          -> "fat loss";
            case "Performans Artır" -> "performance improvement";
            case "Sağlıklı Kal"     -> "healthy lifestyle";
            default -> goal;
        };
    }

    private String mapExperience(String level) {
        return switch (level) {
            case "Yeni Başlayan" -> "beginner";
            case "Orta"          -> "intermediate";
            case "İleri"         -> "advanced";
            default -> level;
        };
    }

    private String mapWorkoutType(String type) {
        return switch (type) {
            case "Güç"     -> "strength training";
            case "Hacim"   -> "hypertrophy training";
            case "Karışık" -> "mixed training";
            default -> type;
        };
    }

    private String mapActivity(String level) {
        return switch (level) {
            case "Haftada 3-4 Gün" -> "3-4 days per week";
            case "Haftada 5-6 Gün" -> "5-6 days per week";
            case "Profesyonel"      -> "every day (professional)";
            default                -> level;
        };
    }
}
