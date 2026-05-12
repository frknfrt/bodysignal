"use client";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

type DataPoint = { value: number };
type Props = { data: DataPoint[]; color?: string };

export default function MiniLineChart({ data, color = "#22c55e" }: Props) {
    return (
        <div className="h-16 w-full mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Tooltip
                        content={() => null} // Mini grafikte tooltip'e gerek yok, sadece görsel akış
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        animationDuration={2000}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}