package com.loboalquileres;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

// @EnableScheduling: habilita el scheduler de Spring para el motor de inflación
// (el job que verifica contratos con ajuste pendiente corre cada día a las 8 AM).
@SpringBootApplication
@EnableScheduling
public class LoboAlquileresApplication {

    public static void main(String[] args) {
        // Fuerza UTC antes de que el driver JDBC envíe la timezone al servidor PostgreSQL.
        // Sin esto, el driver envía "America/Buenos_Aires" y Docker-Postgres lo rechaza
        // si no tiene la zona instalada en tzdata.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

        SpringApplication.run(LoboAlquileresApplication.class, args);
    }
}
