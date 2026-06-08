package com.fracexec.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FracExecApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(FracExecApiApplication.class, args);
	}

}
