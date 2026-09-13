# Matemática detrás de las gráficas

Esta nota explica **qué se está dibujando** en cada sección del laboratorio, a nivel de señales y series de Fourier. No es un manual de código: es la idea de la tesis, en lenguaje de ingeniería.

La serie de Fourier de una señal periódica \(f(t)\) con periodo \(T\) se escribe:

\[
f(t)=\frac{a_0}{2}+\sum_{n=1}^{\infty}\bigl(a_n\cos(n\omega_0 t)+b_n\sin(n\omega_0 t)\bigr)
\]

donde la frecuencia angular fundamental es

\[
\omega_0=\frac{2\pi}{T}.
\]

Cada pantalla del lab mira esa historia desde un ángulo distinto: primero la forma en el tiempo, luego los armónicos, y al final ejemplos típicos ya reconstruidos.

---

## 1. Dominio del tiempo (`/app/tiempo`)

### Qué define el estudiante

Una señal de **pulsos a tramos constantes** (escalera):

- \(t_0\): instante donde empieza el primer módulo.
- Para cada pulso \(k = 1, 2, \ldots, N\):
  - amplitud \(A_k\)
  - tiempo final \(t_k\) (con \(t_k \ge t_{k-1}\))

Entre \(t_{k-1}\) y \(t_k\) la señal vale \(A_k\). Antes de \(t_0\) no hay tramo “activo” en el sentido del constructor; el periodo se toma a partir del último tiempo.

### Periodo y frecuencia

En este módulo el periodo se identifica con el último instante introducido:

\[
T = t_N,\qquad \omega_0=\frac{2\pi}{T}\quad (T>0).
\]

La duración (ancho) del pulso \(k\) es simplemente

\[
\Delta t_k = t_k - t_{k-1}.
\]

Eso es lo que aparece en la tabla “Función \(f(t)\) a reconstruir”.

### Cómo se genera la gráfica (escalera)

No se está calculando aún la serie infinita. Se dibuja la **señal en el dominio del tiempo**:

1. Se recorre el eje \(t\).
2. En cada instante, el valor de la señal es la amplitud del último tramo cuyo tiempo de inicio ya se alcanzó (función escalón por piezas).
3. En pantalla, esa forma se puede **repetir varios periodos** solo para que se vea periódica a ojo; el cálculo de \(T\) y \(\omega_0\) viene del periodo base.

Intuición: si pones \(A_1=1\) de \(t_0=0\) a \(t_1=1\), y \(A_2=-1\) de \(t_1=1\) a \(t_2=2\), ves un pulso positivo seguido de uno negativo, con \(T=2\).

### Qué no hace esta pantalla

No dibuja \(a_n\) ni \(b_n\). Aquí el objetivo pedagógico es: “esta es mi \(f(t)\) a trozos; este es su \(T\) y su \(\omega_0\)”. La descomposición espectral se trabaja en las otras secciones.

---

## 2. Dominio de la frecuencia (`/app/frecuencia`)

### Idea

Aquí no se parte de una escalera de pulsos. Se edita directamente un **espectro truncado**: amplitudes y fases de unos cuantos armónicos, y se reconstruye la onda en el tiempo sumándolos.

Se usan componentes \(n = 0, 1, \ldots, 11\):

- \(A_0\): nivel continuo (offset).
- \(A_n\), \(\varphi_n\) para \(n \ge 1\): amplitud y fase del armónico \(n\).

### Cómo se genera cada trazo

La reconstrucción que se ve abajo es (esquema pedagógico del editor):

\[
y(t)=A_0+\sum_{n=1}^{11} A_n\cos\bigl(n\,\omega\,t+\varphi_n\bigr)
\]

(con una escala de tiempo fija en el lienzo; \(\omega\) es una constante de visualización del laboratorio, no el \(\omega_0\) que calculaste en la sección de tiempo).

- El panel de **barras** muestra \(A_n\) y \(\varphi_n\).
- El panel del **medio** dibuja cada término por separado (y el offset \(A_0\) como línea horizontal).
- El panel de **abajo** es la suma: la señal reconstruida.

Arrastrar una barra cambia un coeficiente; la suma se actualiza al instante. Eso es “ver” cómo un armónico empuja la forma de la onda.

### Presets (“Cargar”)

Los botones de ejemplo no calculan Fourier al vuelo: cargan pares \((A_n,\varphi_n)\) ya preparados (triangular, cuadrada, sierra, etc.) para que el estudiante experimente sin escribir números a mano.

---

## 3. Ejemplos de series típicas (`/app/ejemplos`)

### Tarjetas 1–4 (reconstrucción en vivo)

Cada ejemplo parte de una **señal de pulsos de referencia** (amplitudes y tiempos fijos de la tesis). A partir de ella se estiman coeficientes de Fourier y se suma un truncamiento de la serie para dibujar la curva.

Esquema:

1. Se define el tren de pulsos con vectores \(A_k\) y \(t_k\) (incluye el origen).
2. Periodo \(T = t_N\) y \(\omega_0 = 2\pi/T\).
3. Se calcula el término medio \(a_0\) integrando (en la práctica, sumando) la contribución de cada tramo de amplitud constante:

\[
a_0=\sum_{k=1}^{N}\frac{2}{T}\,A_k\,(t_k-t_{k-1}).
\]

4. Para cada armónico \(n = 1, 2, \ldots, 100\) se obtienen \(a_n\) y \(b_n\) a partir de esos mismos tramos (fórmulas equivalentes a integrar \(f(t)\cos(n\omega_0 t)\) y \(f(t)\sin(n\omega_0 t)\) sobre un periodo, aprovechando que \(f\) es constante a trozos).
5. La gráfica muestra la reconstrucción truncada:

\[
f_N(t)=\frac{a_0}{2}+\sum_{n=1}^{100}\bigl(a_n\cos(n\omega_0 t)+b_n\sin(n\omega_0 t)\bigr)
\]

evaluada en muchos puntos de \(t\) (típicamente un intervalo del orden de dos periodos, para que se vea la repetición).

**Lectura de la curva:** mientras más armónicos uses, más se acerca la suma a la forma “ideal” del ejemplo (cuadrada, tren rectangular, sierra, triangular). Con pocos armónicos verías el efecto Gibbs / bordes redondeados; aquí el truncamiento es alto a propósito para que la figura se lea clara.

> Nota de nombres: en la respuesta del API, la lista llamada `phases` guarda en realidad los \(b_n\) del cálculo histórico. No son ángulos \(\varphi_n\) del editor de frecuencia.

### Tarjetas 5–6 (figura fija)

Seno rectificado de media onda y de onda completa. Aquí no se recalcula la serie en el servidor: se muestra la **figura de la tesis** junto con la fórmula cerrada clásica (coeficientes ya conocidos en la literatura / apuntes). Sirven como referencia visual, no como simulador interactivo.

---

## 4. Cómo encajan las tres secciones

| Sección | Entrada conceptual | Salida que ves |
|---------|--------------------|----------------|
| Tiempo | Escalera \(A_k, t_k\) | Forma de \(f(t)\), \(T\), \(\omega_0\) |
| Frecuencia | Coeficientes \(A_n, \varphi_n\) | Suma de armónicos en el tiempo |
| Ejemplos 1–4 | Pulsos fijos de la tesis | Serie truncada \(\sum a_n,b_n\) |
| Ejemplos 5–6 | Fórmula clásica | Imagen de referencia |

Flujo pedagógico típico:

1. Arma una señal en el **tiempo** y entiende \(T\) y \(\omega_0\).
2. Juega en **frecuencia** para sentir qué hace cada armónico.
3. Compara con los **ejemplos** canónicos y sus fórmulas.

---

## 5. Recordatorios útiles (sin meterse al código)

- Periodo \(T\) y \(\omega_0 = 2\pi/T\) son la base de todo lo periódico.
- Una señal a trozos constantes tiene espectro que decae “lento” (muchos armónicos) si tiene saltos bruscos (p. ej. cuadrada).
- Una triangular / más suave suele necesitar menos energía en armónicos altos.
- El editor de frecuencia usa una representación **amplitud–fase**; los ejemplos 1–4 trabajan sobre todo con la forma **seno–coseno** \(a_n, b_n\). Son dos escrituras equivalentes de la misma idea.

Si un número de la tesis y una gráfica “no cuadran”, gana la tesis: los vectores de ejemplo y las fórmulas de coeficientes están fijados a propósito para el documento académico.
