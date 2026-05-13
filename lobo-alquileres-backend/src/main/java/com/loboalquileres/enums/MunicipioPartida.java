package com.loboalquileres.enums;

/**
 * Detecta la municipalidad de Buenos Aires a partir de los primeros 3 dígitos
 * del número de partida.
 *
 * Los códigos siguen la nomenclatura de la Dirección Provincial de Catastro
 * Territorial (DPCT) de la Provincia de Buenos Aires.
 */
public enum MunicipioPartida {

    AVELLANEDA          ("007", "Avellaneda",                          null),
    BAHIA_BLANCA        ("014", "Bahía Blanca",                        null),
    BERAZATEGUI         ("015", "Berazategui",                         null),
    ESTEBAN_ECHEVERRIA  ("018", "Esteban Echeverría",                  null),
    EZEIZA              ("270", "Ezeiza",                              null),
    FLORENCIO_VARELA    ("023", "Florencio Varela",                    null),
    GENERAL_RODRIGUEZ   ("028", "General Rodríguez",                   null),
    HURLINGHAM          ("408", "Hurlingham",                          null),
    ITUZAINGO           ("410", "Ituzaingó",                           null),
    JOSE_C_PAZ          ("412", "José C. Paz",                         null),
    LA_MATANZA          ("041", "La Matanza",                          null),
    LANUS               ("040", "Lanús",                               null),
    LOMAS_DE_ZAMORA     ("042", "Lomas de Zamora",                     null),
    MAR_DEL_PLATA       ("045", "General Pueyrredón (Mar del Plata)",  null),
    MALVINAS_ARGENTINAS ("414", "Malvinas Argentinas",                 null),
    MERLO               ("056", "Merlo",                               null),
    MORENO              ("059", "Moreno",                              null),
    MORON               ("060", "Morón",                               null),
    PILAR               ("070", "Pilar",                               null),
    QUILMES             ("089", "Quilmes",                             null),
    SAN_FERNANDO        ("105", "San Fernando",                        null),
    SAN_ISIDRO          ("107", "San Isidro",                          null),
    SAN_MARTIN          ("044", "General San Martín",
                         "https://im-tasasmunicipales.sanmartin.gov.ar"),
    SAN_MIGUEL          ("416", "San Miguel",                          null),
    TIGRE               ("113", "Tigre",                               null),
    TRES_DE_FEBRERO     ("116", "Tres de Febrero",                     null),
    VICENTE_LOPEZ       ("118", "Vicente López",                       null),

    DESCONOCIDO         (null,  "Municipio no identificado",           null);

    private final String prefijo;
    private final String nombre;
    private final String urlConsulta;

    MunicipioPartida(String prefijo, String nombre, String urlConsulta) {
        this.prefijo     = prefijo;
        this.nombre      = nombre;
        this.urlConsulta = urlConsulta;
    }

    public String getPrefijo()     { return prefijo; }
    public String getNombre()      { return nombre; }
    public String getUrlConsulta() { return urlConsulta; }

    /** Detecta el municipio a partir del nroPartida. Devuelve DESCONOCIDO si no matchea. */
    public static MunicipioPartida detectar(String nroPartida) {
        if (nroPartida == null || nroPartida.isBlank() || nroPartida.length() < 3) {
            return DESCONOCIDO;
        }
        String prefijo = nroPartida.substring(0, 3);
        for (MunicipioPartida m : values()) {
            if (prefijo.equals(m.prefijo)) return m;
        }
        return DESCONOCIDO;
    }
}
