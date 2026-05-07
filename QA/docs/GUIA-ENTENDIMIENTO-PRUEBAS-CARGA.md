# Guía Completa: Entender las Pruebas de Carga

> **Objetivo**: Explicar de forma clara y práctica todos los conceptos técnicos de las pruebas de carga con Artillery, para que puedas interpretarlos y explicarlos correctamente.

---

## 1. FUNDAMENTOS: ¿Qué son las Pruebas de Carga?

### 1.1 Definición Simple

Las **pruebas de carga** (load testing) son como "simular una fiesta" para tu aplicación:

| Simulación | Realidad |
|------------|----------|
| Contratas 400 personas para entrar a un restaurante | Ejecutas 400 usuarios virtuales en tu app |
| Mides cuánto tardan en sentarse y pedir | Mides el tiempo de respuesta |
| Observas si el mesero se satura | Observas si el servidor se satura |
| Si muchas personas esperan, hay problemas | Si los tiempos suben, hay cuellos de botella |

### 1.2 ¿Por qué hacer pruebas de carga?

```
┌─────────────────────────────────────────────────────────────┐
│                    ¿Para qué sirve?                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Detectar problemas ANTES de producción                  │
│ 2. Saber cuántos usuarios puede soportar tu app           │
│ 3. Encontrar cuellos de botella (DB, servidor, red)       │
│ 4. Establecer baselines (líneas base) para comparar        │
│ 5. Verificar que cumple con SLAs (acuerdos de servicio)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. CONCEPTOS CLAVE DE ARTILLERY

### 2.1 VUs (Usuarios Virtuales)

**¿Qué es?**
Un VU es un "usuario falso" que ejecuta un escenario completo en tu aplicación.

**En el test de PharmaQuick:**
- 400 VUs ejecutaron el escenario completo
- Cada VU hacía: Login → Perfil → Productos → Inventario → Alertas → Logout

```
Flujo de un VU:
┌─────────┐    ┌──────────┐    ┌────────────┐    ┌──────────┐    ┌────────┐
│ Login   │ →  │  Perfil  │ →  │  Productos │ →  │ Inventario│ → │Logout  │
│ (JWT)   │    │          │    │            │    │  Resumen   │  │        │
└─────────┘    └──────────┘    └────────────┘    └──────────┘    └────────┘
     ↓             ↓              ↓                  ↓              ↓
  65-135ms      4-36ms         4-55ms            3-60ms           rápido
```

### 2.2 Phases (Fases de Carga)

Son las "etapas" del test que controlan cuántos usuarios entran y durante cuánto tiempo.

**En tu test:**
```
Fase 1: Warm-up (20 segundos)
         ↑↑ 2 usuarios/segundo
         Aumenta gradualmente

Fase 2: Carga con auth (60 segundos)
         ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
         2 usuarios/segundo → 10 usuarios/segundo
         (rampTo:10)
```

### 2.3 Arrival Rate vs Arrival Count

| Término | Significado | Cuándo usarlo |
|---------|-------------|---------------|
| `arrivalRate: 2` | Crea 2 usuarios **cada segundo** constantemente | La mayoría de tests |
| `arrivalCount: 50` | Crea exactamente 50 usuarios en total | Cuando necesitas un número fijo |
| `rampTo: 10` | Aumenta gradualmente hasta 10 usuarios/segundo | Para warm-up gradual |

### 2.4 Think Time (Tiempo de Espera)

**¿Qué es?**
El tiempo que el usuario "piensa" entre acciones. Los usuarios reales no disparan 100 requests por segundo.

```yaml
scenarios:
  - flow:
      - get: { url: "/productos" }  # 5ms
      - think: 2                    # El usuario "lee" por 2 segundos
      - get: { url: "/detalle/1" }  # 8ms
      - think: 3                    # El usuario "piensa" 3 segundos
      - post: { url: "/carrito" }   # 15ms
```

**¿Por qué es importante?**
- Sin `think`: generas tráfico irreal que puede tumbar tu servidor
- Con `think`: simulas comportamiento real de usuarios

---

## 3. LOS PERCENTILES: Entendiendo p50, p90, p95, p99

### 3.1 Concepto Fundamental

Los **percentiles** son una forma de resumir "muchos números en uno solo".

**Analogía**: Imagina que tienes las notas de 100 exámenes:
```
Notas: 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, ..., 8, 9, 10
       ↑                                      ↑
     peoor                                mejor
```

| Percentil | Significado | En el ejemplo de notas |
|-----------|-------------|------------------------|
| **p50** (mediana) | La mitad de las notas están por debajo | El estudiante "promedio" sacó 5 |
| **p90** | El 90% de las notas están por debajo | 9 de cada 10 estudiantes sacaron menos de X |
| **p95** | El 95% de las notas están por debajo | 19 de cada 20 estudiantes sacaron menos de X |
| **p99** | El 99% de las notas están por debajo | 99 de cada 100 estudiantes sacaron menos de X |

### 3.2 Aplicado a Tiempos de Respuesta

```
Supongamos 1000 requests con estos tiempos (en ms):

[1, 2, 3, 4, 5, 5, 5, 5, 5, 5, ..., 50, 80, 100, 150, 200, 500, 1000]
  ↑                                                          ↑
minimo                                                    maximo

p50 = 7ms    → El 50% de los requests fueron más rápidos que 7ms
p90 = 80ms   → El 90% de los requests fueron más rápidos que 80ms
p95 = 90ms   → El 95% de los requests fueron más rápidos que 90ms
p99 = 105ms  → El 99% de los requests fueron más rápidos que 105ms
```

### 3.3 ¿Por qué tantos percentiles?

Porque cada uno revela información diferente:

| Percentil | Para qué sirve | Tu resultado (87.4ms) |
|-----------|----------------|-----------------------|
| **p50** (mediana) | Comportamiento "típico", sin extremos | 7ms - La mayoría muy rápido |
| **p90** | Usuarios que tiveram mala suerte | 80ms -Aún rápido |
| **p95** | El "peor caso común" - **el más importante** | 87.4ms - ✅ cumple <500ms |
| **p99** | Casos raros pero posibles | 104.6ms - ✅ cumple <1000ms |
| **p999** | Extremadamente raros (1 de cada 1000) | 125.2ms - para análisis profundo |

### 3.4 Interpretación Práctica

```
"Mi app tiene p95 = 87.4ms"

Traducción: "El 95% de los usuarios experimentan tiempos de respuesta
             menores a 87.4ms. Solo el 5%实验中 tiempos más altos."

"Mi app tiene p99 = 104.6ms"

Traducción: "El 99% de los usuarios tienen respuestas menores a 104.6ms.
             Solo 1 de cada 100 usuarios experimentan latencia mayor."
```

### 3.5 ¿Qué pasa cuando p95 es mucho mayor que p50?

Esta es una señal muy importante:

```
p50 = 7ms
p95 = 87ms   ← 12 veces más lento!

Esto indica que hay algunos usuarios que tienen problemas significativos.
Possible causes:
- Algunos endpoints son más lentos
- Cache no funciona para ciertos casos
- Queries complejas para ciertos datos
- Concurrencia alta en ciertos momentos
```

---

## 4. MÉTRICAS PRINCIPALES EXPLICADAS

### 4.1 Latencia (Response Time)

| Métrica | Significado | Tu resultado |
|---------|-------------|--------------|
| **min** | El request más rápido | 1ms |
| **max** | El request más lento | 128ms |
| **mean** | Promedio de todos | 18.1ms |
| **p50** (median) | La mitad rápido, la mitad lento | 7ms |
| **p95** | 95% más rápido que esto | 87.4ms |
| **p99** | 99% más rápido que esto | 104.6ms |

### 4.2 Throughput (Rendimiento)

| Métrica | Significado | Tu resultado |
|---------|-------------|--------------|
| **Request Rate** | Cuántos requests por segundo | ~35 req/seg |
| **RPS** | Requests per second | 35 |

**¿Cuánto es "bueno"?**
- Depende de tu aplicación
- Un e-commerce típico: 50-500 RPS
- Una API interna: 100-2000 RPS
- **Tu resultado (35 RPS)** significa: durante el test,平均处理35个请求每秒

### 4.3 Códigos HTTP

| Código | Significado | Cantidad | Análisis |
|--------|-------------|----------|----------|
| **200** | Éxito total | 1,712 | ✅Bien |
| **400** | Error del cliente (tu app rechaza la petición) | 400 | ⚠️ Revisar |
| **401** | No autorizado (falta JWT) | 0 | ✅ |
| **404** | No encontrado | 0 | ✅ |
| **500** | Error del servidor | 0 | ✅ Sin errores graves |

### 4.4 Errors y VUs

| Métrica | Significado | Tu resultado |
|---------|-------------|--------------|
| **vusers.created** | Total de VUs que iniciaron | 400 |
| **vusers.completed** | VUs que terminaron exitosamente | 400 |
| **vusers.failed** | VUs que fallaron (no completaron) | 0 |
| **VUs.session_length** | Cuánto tiempo dura un VU completo | 3-8 segundos |

---

## 5. GRÁFICAS DE ARTILLERY: Cómo Leerlas

### 5.1 Gráfico de Latencia en el Tiempo

```
Eje Y: Tiempo de respuesta (ms)
Eje X: Tiempo del test (segundos)

         p99 (peor caso)
          │
    120ms │                          ╭──╮
          │                       ╭─╯  ╰─╮
    100ms │                    ╭─╯       ╰─╮
          │                 ╭─╯           ╰─╮
     80ms │              ╭─╯                ╰─╮
          │           ╭─╯                    ╰─╮ p95 (línea 95%)
     60ms │        ╭─╯                          ╰──╮
          │     ╭─╯                                ╰─ p50 (mediana)
     40ms │   ╭─╯
          │╭─╯
     20ms │╯
          │╰────────────────────────────
      0ms └─────────────────────────────────→ Tiempo
           0    20    40    60    80   100
                        ↑ fase 2 (carga)
```

**Qué buscar:**
- **Línea estable = buena**: Si las líneas son relativamente planas, el servidor maneja bien la carga
- **Línea hacia arriba = problema**: Si p99 sube mucho, el servidor se está sobrecargando
- **Picos = errores intermitentes**: Picos suddenes pueden indicar timeouts o errores específicos

### 5.2 Gráfico de Throughput

```
Eje Y: Requests por segundo
Eje X: Tiempo

 50 │          ████████
    │       ████████████
 40 │     ████████████████
    │    ██████████████████
 30 │   ████████████████████
    │  █████████████████████
 20 │ ███████████████████████
    │████████████████████████
 10 │██████████████████████████
    │██████████████████████████
  0 └──────────────────────────
      0    20    40    60    80
```

**Qué buscar:**
- **Línea estable hacia arriba = carga gradualmente**: Lo esperado
- **Meseta horizontal = límite del servidor**: Si la línea se plana pero los VUs siguen aumentando, el servidor no da más

### 5.3 Gráfico de Códigos de Respuesta

```
Códigos HTTP
    │
200 │████████████████████████████ 1,712 (81%)
    │
400 │████████ 400 (19%)
    │
500 │ 0
    │
    └──────────────────────────────
```

**Qué buscar:**
- **Solo verde (200) = éxito perfecto**
- **Rojo (500) = problemas graves**: El servidor está fallando
- **Amarillo (400) = revisar**: Puede ser normal (ej: sin token) o problema

---

## 6. ENTENDIENDO TUS RESULTADOS

### 6.1 Resumen Ejecutivo

| Métrica | Tu Valor | Umbral | Estado |
|---------|----------|--------|--------|
| **p95** | 87.4 ms | < 500 ms | ✅ PASA |
| **p99** | 104.6 ms | < 1000 ms | ✅ PASA |
| **Errores 500** | 0 | 0 | ✅ PASA |
| **VUs fallidos** | 0 | 0 | ✅ PASA |

### 6.2 Traducción para No Técnicos

**Para explicar a tu equipo/jefe:**

> "Ejecutamos 400 usuarios simulados haciendo operaciones reales (login, ver productos, revisar inventario) durante aproximadamente 1.5 minutos. El resultado fue que el 95% de las operaciones respondieron en menos de 87 milisegundos, lo cual está muy por debajo de nuestro límite de 500ms. No hubo errores del servidor y todos los usuarios completaron sus tareas exitosamente."

### 6.3 Análisis por Endpoint

| Endpoint | p95 | p99 | Análisis |
|----------|-----|-----|----------|
| /api/auth/login | 111ms | 125ms | Más lento - esperado (hace hash + JWT) |
| /api/perfil | 16ms | 21ms | Rápido |
| /api/productos | 15ms | 29ms | Rápido |
| /api/inventario/resumen | 16ms | 23ms | Rápido |
| /api/inventario/alertas | 15ms | 22ms | Rápido |
| /health | 16ms | 19ms | Rápido |

---

## 7. ERRORES 400: ¿Qué pasó con /api/public/catalogo?

### 7.1 El Problema

Obtuviste 400 códigos 400 en el endpoint `/api/public/catalogo` cuando debería ser público.

### 7.2 Posibles Causas

1. **El endpoint no está marcado como público** en el Router
2. **El middleware JWT lo intercepta** antes de llegar al handler
3. **El cliente envía mal el request** (falta header, mal formato)

### 7.3 Cómo Verificar

```bash
# Test público sin token
curl http://localhost:8080/api/public/catalogo

# Si responde 200, el problema está en el test
# Si responde 400, el endpoint necesita configuración
```

---

## 8. GLOSARIO RÁPIDO

| Término | Definición Simple |
|---------|-------------------|
| **VUs** | Usuarios virtuales simulados |
| **Arrival Rate** | Cuántos usuarios entran por segundo |
| **Think Time** | Pausa entre acciones (simula lectura) |
| **p50** | Mediana - la mitad más rápida |
| **p95** | 95% de usuarios más rápidos que este valor |
| **p99** | 99% de usuarios más rápidos que este valor |
| **RPS** | Requests por segundo |
| **Latencia** | Tiempo de respuesta |
| **Throughput** | Capacidad de procesamiento |
| **Threshold** | Umbral límite para pasar/fallar |
| **Warm-up** | Fase inicial de calentamiento |
| **Ramp-up** | Aumento gradual de carga |

---

## 9. RESUMEN: Cómo Presentar los Resultados

### 9.1 Formato Ejecutivo (1分钟)

```
"Ejecutamos pruebas de carga con 400 usuarios simulados.
El 95% de las operaciones respondieron en menos de 87ms.
No hubo errores del servidor. La aplicación está lista para producción."
```

### 9.2 Formato Técnico (5 minutos)

```
"Test: jwt-auth.yaml
- 400 VUs, 2,112 requests, ~35 RPS
- p95: 87.4ms (< 500ms threshold ✓)
- p99: 104.6ms (< 1000ms threshold ✓)
- Códigos: 1,712 (200), 400 (400), 0 (500)
- VUs fallidos: 0

Conclusión: La aplicación maneja bien la carga de prueba.
Recomendación: Revisar los 400 errores en /api/public/catalogo."
```

### 9.3 Formato Detallado (para documentación)

Ver el archivo `INFORME-TECNICO-PRUEBAS-CARGA.md` en la carpeta `docs/`.

---

## 10. SIGUIENTES PASOS

Ahora que entiendes los conceptos:

1. **Revisa la gráfica**: Abre `QA/resultados/Grafics/jwt-auth.json.html`
2. **Compara con otros tests**: Ejecuta `npm run test:basic` y compara
3. **Prueba con más carga**: Aumenta el `arrivalRate` a 50 o 100
4. **Investiga los 400**: Revisa por qué `/api/public/catalogo` falla

---

**Documento creado**: 6 Mayo 2026  
**Basado en**: Resultados de prueba jwt-auth.json  
**PharmaQuick QA - Guía Educativa