package com.example.app;

import io.fluxzero.common.serialization.JsonUtils;
import io.fluxzero.sdk.Fluxzero;
import io.fluxzero.sdk.configuration.spring.FluxzeroSpringConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

@SpringBootApplication
//@Import(FluxzeroSpringConfig.class)
@Slf4j
public class App {

	public static void main(String[] args) {
		SpringApplication.run(App.class, args);
		Fluxzero.sendCommandAndWait(JsonUtils.fromFile("/refdata/register-operators.json"));
		log.info("Application running");
	}

}
