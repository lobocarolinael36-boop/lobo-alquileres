package com.loboalquileres.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    /** Bean compartido para llamadas HTTP salientes (ICL del BCRA).
     *  Timeout de 5 s para que el @PostConstruct no bloquee el arranque
     *  si la API del BCRA no responde. */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(5_000);
        return new RestTemplate(factory);
    }
}
