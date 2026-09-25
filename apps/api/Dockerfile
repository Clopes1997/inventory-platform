FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml ./
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN groupadd --system inventory && useradd --system --gid inventory inventory
COPY --from=build --chown=inventory:inventory /workspace/target/quarkus-app/ ./
USER inventory
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]
