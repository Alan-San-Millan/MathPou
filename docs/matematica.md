# Matemática detrás de las gráficas

Esta nota explica **qué se está dibujando** en cada sección del laboratorio, a nivel de señales y series de Fourier. No es un manual de código: es la idea de la tesis, en lenguaje de ingeniería.

La serie de Fourier de una señal periódica **f(t)** con periodo **T** se escribe:

```text
                 ∞
f(t) = a₀/2  +  Σ  [ aₙ·cos(n·ω₀·t) + bₙ·sin(n·ω₀·t) ]
                n=1
```

donde la frecuencia angular fundamental es:

```text
ω₀ = 2π / T
```

Cada pantalla del lab mira esa historia desde un ángulo distinto: primero la forma en el tiempo, luego los armónicos, y al final ejemplos típicos ya reconstruidos.

---

## 1. Dominio del tiempo (`/app/tiempo`)

### Qué define el estudiante

Una señal de **pulsos a tramos constantes** (escalera):

Hay 4 pulsos de base (se pueden agregar hasta 10). Cada pulso tiene:

- tiempo inicial **tᵢ**, tiempo final **t_f** (con **t_f > tᵢ**) y amplitud **A**.

Solo cuentan los pulsos con los tres campos llenos; los incompletos se ignoran con un aviso. El **tᵢ** de un pulso no puede ser menor que el **t_f** del anterior; si queda un hueco, la señal vale 0 en él. Internamente se arma la matriz del API **[[0, t₀], [A₁, t₁], …]** con **t₀** = primer **tᵢ** y los huecos como tramos de amplitud 0.

### Periodo y frecuencia

En este módulo el periodo se identifica con el último instante introducido:

```text
T = tₙ − t₀     (con t₀ = 0 es simplemente tₙ)
ω₀ = 2π / T     (si T > 0)
```

La duración (ancho) del pulso **k** es:

```text
Δtₖ = tₖ − tₖ₋₁
```

Eso es lo que aparece en la tabla “Función f(t) a reconstruir”.

### Cómo se genera la gráfica (escalera)

No se está calculando aún la serie infinita. Se dibuja la **señal en el dominio del tiempo**:

1. Se recorre el eje **t**.
2. En cada instante, el valor de la señal es la amplitud del último tramo cuyo tiempo de inicio ya se alcanzó (función escalón por piezas).
3. En pantalla, esa forma se puede **repetir varios periodos** solo para que se vea periódica a ojo; el cálculo de **T** y **ω₀** viene del periodo base.

**Intuición:** si pones **A₁ = 1** de **t₀ = 0** a **t₁ = 1**, y **A₂ = −1** de **t₁ = 1** a **t₂ = 2**, ves un pulso positivo seguido de uno negativo, con **T = 2**.

### Reconstrucción con N armónicos

El estudiante elige cuántos armónicos usar. El servidor calcula, igual que `tren_n_pulsos.m`, integrando sobre [t₀, tₙ]:

```text
a₀ = Σ (2/T) · Aₖ · (tₖ − tₖ₋₁)
aₙ = Σ (1/(nπ)) · Aₖ · [sin(nω₀tₖ) − sin(nω₀tₖ₋₁)]
bₙ = −Σ (1/(nπ)) · Aₖ · [cos(nω₀tₖ) − cos(nω₀tₖ₋₁)]
```

y dibuja **f_N(t) = a₀/2 + Σₙ₌₁ᴺ [aₙ cos(nω₀t) + bₙ sin(nω₀t)]** desde t₀ hasta t₀ + 4T.

Se ven tres gráficas con la misma escala: la ideal (azul oscuro), la reconstrucción (rojo) y ambas superpuestas, donde se aprecia el efecto Gibbs en los saltos.

---

## 2. Dominio de la frecuencia (`/app/frecuencia`)

### Idea

Aquí no se parte de una escalera de pulsos. Se edita directamente un **espectro truncado**: amplitudes y fases de unos cuantos armónicos, y se reconstruye la onda en el tiempo sumándolos.

Se usan componentes **n = 0, 1, …, 11**:

- **A₀**: nivel continuo (offset).
- **Aₙ**, **φₙ** para **n ≥ 1**: amplitud y fase del armónico **n**.

### Cómo se genera cada trazo

La reconstrucción que se ve abajo es (esquema pedagógico del editor):

```text
                 11
y(t) = A₀  +  Σ   Aₙ · cos(n·ω·t + φₙ)
                 n=1
```

(con una escala de tiempo fija en el lienzo; **ω** es una constante de visualización del laboratorio, no el **ω₀** que calculaste en la sección de tiempo).

- El panel de **barras** muestra **Aₙ** y **φₙ**.
- El panel del **medio** dibuja cada término por separado (y el offset **A₀** como línea horizontal).
- El panel de **abajo** es la suma: la señal reconstruida.

Arrastrar una barra cambia un coeficiente; la suma se actualiza al instante. Eso es “ver” cómo un armónico empuja la forma de la onda.

### Presets (“Cargar”)

Los botones de ejemplo no calculan Fourier al vuelo: cargan pares **(Aₙ, φₙ)** ya preparados (triangular, cuadrada, sierra, etc.) para que el estudiante experimente sin escribir números a mano.

---

## 3. Ejemplos de series típicas (`/app/ejemplos`)

### Tarjetas 1–4 (reconstrucción en vivo)

Cada ejemplo parte de una **señal de pulsos de referencia** (amplitudes y tiempos fijos de la tesis). A partir de ella se estiman coeficientes de Fourier y se suma un truncamiento de la serie para dibujar la curva.

Esquema:

1. Se define el tren de pulsos con vectores **Aₖ** y **tₖ** (incluye el origen).
2. Periodo **T = tₙ** y **ω₀ = 2π / T**.
3. Se calcula el término medio **a₀** sumando la contribución de cada tramo de amplitud constante:

```text
         N
a₀ = Σ  (2/T) · Aₖ · (tₖ − tₖ₋₁)
        k=1
```

4. Para cada armónico **n = 1, 2, …, 100** se obtienen **aₙ** y **bₙ** a partir de esos mismos tramos (equivalente a integrar **f(t)·cos(n·ω₀·t)** y **f(t)·sin(n·ω₀·t)** sobre un periodo, aprovechando que **f** es constante a trozos).
5. La gráfica muestra la reconstrucción truncada:

```text
                    100
fₙ(t) = a₀/2  +  Σ   [ aₙ·cos(n·ω₀·t) + bₙ·sin(n·ω₀·t) ]
                   n=1
```

evaluada en muchos puntos de **t** (típicamente un intervalo del orden de dos periodos, para que se vea la repetición).

**Lectura de la curva:** mientras más armónicos uses, más se acerca la suma a la forma “ideal” del ejemplo (cuadrada, tren rectangular, sierra, triangular). Con pocos armónicos verías bordes redondeados (efecto Gibbs); aquí el truncamiento es alto a propósito para que la figura se lea clara.

> Nota de nombres: en la respuesta del API, la lista llamada `phases` guarda en realidad los **bₙ** del cálculo histórico. No son ángulos **φₙ** del editor de frecuencia.

### Tarjetas 5–6 (figura fija)

Seno rectificado de media onda y de onda completa. Aquí no se recalcula la serie en el servidor: se muestra la **figura de la tesis** junto con la fórmula cerrada clásica (coeficientes ya conocidos en la literatura / apuntes). Sirven como referencia visual, no como simulador interactivo.

---

## 4. Cómo encajan las tres secciones

| Sección | Entrada conceptual | Salida que ves |
|---------|--------------------|----------------|
| Tiempo | Escalera Aₖ, tₖ y N armónicos | Forma de f(t), T, ω₀ y reconstrucción con N armónicos |
| Frecuencia | Coeficientes Aₙ, φₙ | Suma de armónicos en el tiempo |
| Ejemplos 1–4 | Pulsos fijos de la tesis | Serie truncada (aₙ, bₙ) |
| Ejemplos 5–6 | Fórmula clásica | Imagen de referencia |

Flujo pedagógico típico:

1. Arma una señal en el **tiempo** y entiende **T** y **ω₀**.
2. Juega en **frecuencia** para sentir qué hace cada armónico.
3. Compara con los **ejemplos** canónicos y sus fórmulas.

---

## 5. Recordatorios útiles (sin meterse al código)

- Periodo **T** y **ω₀ = 2π / T** son la base de todo lo periódico.
- Una señal a trozos constantes tiene espectro que decae “lento” (muchos armónicos) si tiene saltos bruscos (p. ej. cuadrada).
- Una triangular / más suave suele necesitar menos energía en armónicos altos.
- El editor de frecuencia usa una representación **amplitud–fase**; los ejemplos 1–4 trabajan sobre todo con la forma **seno–coseno** **aₙ**, **bₙ**. Son dos escrituras equivalentes de la misma idea.

Si un número de la tesis y una gráfica “no cuadran”, gana la tesis: los vectores de ejemplo y las fórmulas de coeficientes están fijados a propósito para el documento académico.
