FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/app.jar /app/app.jar
RUN ls -la /app/
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
EXPOSE 8080