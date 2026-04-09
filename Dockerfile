FROM eclipse-temurin:25-jre

RUN groupadd --system javauser && useradd --system --shell /bin/false --gid javauser javauser
COPY --chown=javauser:javauser target/pitstop.jar pitstop.jar
USER javauser

CMD ["java", "-XX:MaxRAMPercentage=75", "-XX:SoftRefLRUPolicyMSPerMB=2500", "-jar", "pitstop.jar"]
