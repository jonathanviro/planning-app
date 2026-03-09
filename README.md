# 📱 IT Business Partner Planning Tool - Frontend

Aplicación interactiva tipo "Tótem" (pantalla táctil) diseñada para facilitar la planificación estratégica anual de iniciativas de TI. Permite a los usuarios asignar iniciativas a trimestres, gestionar horas y visualizar la carga de trabajo en tiempo real.

## 🚀 Contexto y Objetivo

El objetivo era crear una interfaz **lúdica, táctil y visual** para un evento de un día. La aplicación debía ser intuitiva (Drag & Drop), reactiva (actualización inmediata de gráficos) y resiliente (guardado de estado local).

## 🛠 Tech Stack & Decisiones de Diseño

### Core

- **React + Vite**: Elegido por su velocidad de desarrollo, recarga rápida (HMR) y ecosistema robusto.
- **TypeScript**: Fundamental para mantener la integridad de los datos (Iniciativas, Trimestres, Horas) y evitar errores lógicos durante el desarrollo.

### Estado & Lógica

- **Zustand**:
  - _¿Por qué?_ Se eligió sobre Redux o Context API por su simplicidad y rendimiento. Permite manejar el estado global (asignaciones, horas, filtros) sin boilerplate excesivo.
  - _Persistencia:_ Usamos el middleware `persist` para guardar el progreso en `localStorage`. Esto asegura que si el tótem se recarga, el usuario no pierde su trabajo (mientras no tengamos el backend conectado).

### UI & Estilos

- **Tailwind CSS (v4)**:
  - _¿Por qué?_ Para un desarrollo rápido de UI y fácil mantenimiento de la identidad corporativa. Definimos las variables de color (`--color-brand-red`, etc.) directamente en CSS para un cambio de tema global sencillo.
- **Diseño "TotemLayout"**: Un layout específico pensado para pantallas grandes y táctiles, con elementos grandes y espaciado generoso para facilitar la interacción con el dedo.

### Interactividad

- **@dnd-kit**:
  - _¿Por qué?_ Librería moderna y modular para Drag & Drop. Ofrece mejor accesibilidad y control sobre los eventos de arrastre que las alternativas más antiguas.
- **Recharts**:
  - _¿Por qué?_ Librería de gráficos composable para React. Se integra perfectamente con el estado de React, permitiendo que los gráficos se animen y actualicen instantáneamente al mover una tarjeta.

## 🏗 Arquitectura del Proyecto

La estructura se mantuvo lo más plana posible para facilitar la navegación:

- **`src/store.ts`**: **El cerebro de la app**. Contiene toda la lógica de negocio:
  - Estado de iniciativas y asignaciones.
  - Acciones (asignar, remover, actualizar horas).
  - Cálculo de estadísticas (KPIs) en tiempo real.
- **`src/data.ts`**: Separación de los datos iniciales (Mock) de la lógica. Esto facilita la futura integración con el backend (solo habrá que reemplazar la carga inicial).
- **`src/types.ts`**: Definiciones de TypeScript compartidas (Single Source of Truth) para evitar inconsistencias en los nombres de propiedades.
- **`src/components/`**:
  - `QuarterZone`: Componente inteligente que maneja la lógica de un trimestre (cálculo de límites, visualización de alertas).
  - `InitiativeCard`: Tarjeta visual con soporte para Drag & Drop.
  - `Modals`: (Assignment, Quarter, Confirmation) separados para mantener limpio el código del Dashboard.

## ✨ Funcionalidades Clave Implementadas

1.  **Dashboard Interactivo**:
    - **Drag & Drop**: Arrastrar iniciativas desde el Backlog a los Trimestres (Q1-Q4).
    - **Validación de Horas**: Alertas visuales y bloqueo si se intentan asignar 0 horas.
    - **Feedback Visual**: Indicadores de "Excedido" en los trimestres si se supera la capacidad.
2.  **Gestión de Backlog**:
    - Filtros avanzados (Texto, Stream, Tipo, Prioridad) para manejar grandes volúmenes de datos (40+ iniciativas).
3.  **Visualización de Datos**:
    - Gráficos de Pastel y Barras que reflejan la distribución actual de la planificación.
    - Barra de progreso de capacidad anual en el perfil.
4.  **Modales de Gestión**:
    - **Asignación**: Permite distribuir horas y asignar a múltiples trimestres.
    - **Detalle de Trimestre**: Vista expandida para cuando hay muchas actividades en un Q.

## 💻 Instalación y Ejecución

1.  **Instalar dependencias**:

    ```bash
    npm install
    ```

2.  **Correr en desarrollo**:

    ```bash
    npm run dev
    ```

3.  **Construir para producción**:
    ```bash
    npm run build
    ```

---

_Proyecto desarrollado para evento de planificación ITBP._

**Desarrollado por:** Jonathan Vivero Rodriguez (jonathanviro37@gmail.com)
