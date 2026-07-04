# 构建阶段（容器内自带 JDK 17，本机无需安装）
# 基础镜像走 DaoCloud 镜像，避免直连 Docker Hub 超时
FROM docker.m.daocloud.io/library/eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn
COPY src src

RUN chmod +x mvnw && ./mvnw -q -DskipTests package

# 运行阶段
FROM docker.m.daocloud.io/library/eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
