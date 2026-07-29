# RM CENTRO DE ENTRENAMIENTO
## Sistema Web de Gestión - Design Brief para Stitch

---

## PARTE 1: RESUMEN EJECUTIVO DEL SISTEMA

### Objetivo
Aplicación web para optimizar la administración del gimnasio, mejorar el seguimiento de alumnos y facilitar la comunicación entre profesores y clientes, con énfasis en el control de cuotas.

### Alcance
- Gestión integral de alumnos
- Control de pagos y cuotas
- Creación de rutinas personalizadas
- Seguimiento de progreso físico
- Sistema de reservas de clases
- Notificaciones automáticas
- Estadísticas y reportes

### Plataformas
- Web (responsive)
- Compatible con acceso mobile
- Interfaz intuitiva y sencilla

---

## PARTE 2: ACTORES Y FLUJOS PRINCIPALES

### Actor 1: ADMINISTRADOR (Profesor con permiso de Administrador)
> El rol de Administrador no es un tipo de persona aparte: es un permiso que se le
> otorga a un Profesor (ej. el dueño del gimnasio o un encargado). Un profesor "común"
> solo ve sus propias clases, alumnos, asistencia y rutinas; un profesor con permiso de
> administrador ve y gestiona todo el sistema. Puede haber más de un profesor-admin.

**Responsabilidades:**
- Gestión completa del sistema
- Administración de alumnos (CRUD)
- Control de pagos y cuotas
- Creación y asignación de rutinas
- Envío de notificaciones
- Visualización de estadísticas
- Gestión de reservas
- Administración de profesores (altas, especialidades, turnos, asistencia)
- Administración del catálogo de planes de entrenamiento y precios

**Pantallas Clave:**
- Dashboard administrativo
- Listado de alumnos
- Control de cuotas
- Gestión de rutinas
- Reportes y estadísticas
- Gestión de profesores
- Asistencia de profesores
- Gestión de planes y precios

### Actor 2: ALUMNO (Usuario Final)
**Responsabilidades:**
- Consultar su rutina asignada
- Registrar asistencia
- Reservar horarios de clases
- Seguimiento de progreso
- Consultar estado de cuota
- Visualizar fotos de evolución

**Pantallas Clave:**
- Dashboard personal
- Mi rutina
- Mis asistencias
- Reserva de clases
- Estado de cuota
- Mi progreso

---

## PARTE 3: MÓDULOS FUNCIONALES PRINCIPALES

### A. GESTIÓN DE ALUMNOS
```
├── Registrar alumno
├── Editar información
├── Buscar alumnos
├── Dar de baja
└── Gestionar usuario/contraseña
```
**Estados posibles:**
- Activo
- Inactivo
- De baja
- Suspendido

---

### B. GESTIÓN DE CUOTAS (MÓDULO CRÍTICO — el más prioritario para el gimnasio)
```
├── Registrar pago (genera comprobante, ver módulo 16)
├── Registrar medio de pago (Efectivo/Transferencia/MercadoPago/Tarjeta)
├── Historial de pagos
├── Estados:
│   ├── 🟢 PAGADA
│   ├── 🟡 ADEUDADA (venció pero está dentro del rango de gracia configurado)
│   └── 🔴 VENCIDA (pasó el rango de gracia sin pago → se aplica recargo)
├── Configuración de días de gracia y recargo (% o monto fijo)
├── Recordatorios automáticos
└── Reporte de cuotas vencidas y recargos aplicados
```

**Motor de estados y recargos (definido con el profesor principal):**
```
fecha_actual ≤ fecha_vencimiento + días_de_gracia   →  ADEUDADA (sin recargo)
fecha_actual > fecha_vencimiento + días_de_gracia   →  VENCIDA  (+ recargo)
pago registrado                                      →  PAGADA  (en cualquier momento)
```
Los días de gracia y el recargo (porcentaje o monto fijo) se configuran desde la propia
pantalla de Control de Cuotas (ver pantalla 6). El recargo se calcula una sola vez, en el
momento exacto en que la cuota pasa a Vencida, y queda fijo aunque después cambie la
configuración general — así el monto a cobrar es predecible para el alumno. Detalle
completo del motor de estados en `docs/modelo_datos.md` (sección 3).

**Visualización:**
- Badge de estado (🟢 Pagada / 🟡 Adeudada / 🔴 Vencida)
- Fecha de vencimiento
- Monto base + recargo (si aplica)
- Método de pago

**Prorrateo (alta, baja o cambio de plan a mitad de mes):**
```
monto_final = (monto_base / días_del_mes) × días_facturados
```
Se aplica solo en el mes de alta y en el mes de baja/cambio de plan (si corresponde); los
meses completos intermedios facturan el monto de lista. Un cambio de plan a mitad de mes
genera **dos cuotas prorrateadas** (una que cierra el plan viejo, otra que abre el plan
nuevo). Ver detalle y casos límite en `docs/modelo_datos.md` (secciones 3 y 4).

---

### C. SISTEMA DE ASISTENCIA (ALUMNOS)
```
├── Registro de ingreso (por alumno)
├── Historial de asistencias
├── Visualización por profesor
├── Consulta por alumno
└── Estadísticas de asistencia (%)
```

**Datos capturados:**
- Fecha/hora ingreso
- Alumno
- Duración (si aplica)
- Estado (Presente/Ausente)

---

### D. RESERVA DE CLASES
```
├── Ver disponibilidad
├── Reservar horario
├── Cancelar reserva
├── Limitar cupos por clase
└── Calendario de disponibilidad
```

**Restricciones:**
- Máximo de alumnos por clase (configurable)
- Horarios disponibles (definidos por admin)
- Cancelación hasta X horas antes

---

### E. SISTEMA DE RUTINAS
```
├── Crear rutina personalizada
├── Asignar a alumno
├── Ejercicios:
│   ├── Nombre del ejercicio
│   ├── Series
│   ├── Repeticiones
│   ├── Peso utilizado
│   └── Observaciones
├── Registrar progreso
└── Historial de cambios
```

**Estructura:**
- Rutina (contiene múltiples ejercicios)
- Ejercicio (detalles técnicos)
- Progreso (seguimiento de peso/reps)

---

### F. SEGUIMIENTO FÍSICO
```
├── Registrar objetivos
├── Galería de fotos (progreso)
├── Historial de evolución
├── Comparación antes/después
└── Métricas (peso, medidas)
```

---

### G. SISTEMA DE NOTIFICACIONES
**Automáticas:**
- Cuota próxima a vencer (7 días antes)
- Cuota vencida (al día siguiente)
- Mensajes de motivación (semanal)
- Promociones especiales
- Avisos del gimnasio

**Canal:**
- Push (si es app)
- Email
- SMS (opcional)

---

### I. GESTIÓN DE PROFESORES (NUEVO)
```
├── Registrar profesor
├── Editar información
├── Asignar especialidades (Musculación, Spinning, CrossFit, GAP, Funcional...)
├── Asignar turnos de trabajo
├── Dar de baja
└── Gestionar usuario/contraseña
```
**Estados posibles:** Activo / Inactivo / De baja

**Ficha del profesor:**
- Datos personales
- Especialidades (multi-select sobre catálogo de Disciplinas)
- Turnos asignados (Mañana/Tarde/Noche)
- Clases que dicta (vínculo con Sistema de Clases)
- Historial de asistencia (ver módulo J)

---

### J. ASISTENCIA DE PROFESORES (NUEVO)
```
├── Fichada de entrada/salida (por turno o por clase)
├── Registro manual (admin) para casos de olvido
├── Historial por profesor
├── Estados: Presente / Tarde / Ausente / Justificado
└── Reporte de puntualidad y ausentismo
```
**Diferencia clave con el módulo C (Asistencia de Alumnos):** acá el profesor es el
sujeto que se fichó, no quien toma lista. Es un módulo administrativo, visible solo
para el Admin — sirve para control interno y, a futuro, liquidación de honorarios.

---

### K. PLANES DE ENTRENAMIENTO Y PRECIOS (NUEVO)
```
├── Catálogo de Disciplinas (Musculación, Spinning, CrossFit, GAP, Funcional...)
├── Alta de Plan (Disciplina + frecuencia semanal + precio)
│   ├── Ej: "Musculación 3x semana" - $15.000
│   ├── Ej: "Musculación Libre (todos los días)" - $22.000
│   ├── Ej: "Spinning 2x semana" - $12.000
│   └── Ej: "CrossFit 3x semana" - $20.000
├── Historial de precios (cambios sin afectar cuotas ya emitidas)
├── Activar/desactivar planes
└── Inscripción de alumno a un plan (define el monto de su cuota)
```
**Reglas:**
- Cada plan pertenece a una única disciplina y tiene su propio precio.
- Un alumno puede tener una o más inscripciones activas (ej. Musculación + Spinning).
- El precio que se factura es el vigente en `plan_precio_historico` al momento del
  período, no el precio actual del plan (protege cuotas ya emitidas de cambios por
  inflación).

---

### H. ESTADÍSTICAS Y REPORTES
```
├── Alumnos activos (cantidad)
├── Alumnos por mes (gráfico)
├── Recaudación mensual (ingresos)
├── Cuotas vencidas (listado)
├── Ingresos por período (comparativo)
└── Tasa de asistencia (promedio)
```

**Visualización:**
- Gráficos de barras/líneas
- Tablas resumidas
- KPIs clave

---

## PARTE 4: PALETA DE COLORES (Basada en Logo RM)

### Colores Primarios
```
NARANJA PRINCIPAL:  #E8973A
├─ Uso: CTAs, botones activos, avisos positivos
├─ Semántica: Energía, acción, urgencia (cuotas)
└─ Contraste: Alto sobre blanco y oscuro

GRIS OSCURO:        #2C3E40
├─ Uso: Texto principal, bordes, estructuras
├─ Semántica: Estabilidad, profesionalismo, confianza
└─ Peso visual: Ancla del diseño

BLANCO:             #FFFFFF
├─ Uso: Fondos, negatividad, claridad
└─ Semántica: Limpieza, espacio respirable
```

### Colores Semánticos (Estados)
```
ESTADO AL DÍA (🟢):        #4CAF50 (Verde)
├─ RGB: 76, 175, 80
├─ Uso: Cuotas pagadas, asistencia presente
└─ Confianza: Alto

PRÓXIMA A VENCER (🟡):     #FFC107 (Amarillo)
├─ RGB: 255, 193, 7
├─ Uso: Alerta suave, requiere atención
└─ Urgencia: Media

VENCIDA (🔴):              #F44336 (Rojo)
├─ RGB: 244, 67, 52
├─ Uso: Cuotas vencidas, alertas críticas
└─ Urgencia: Alta

INFORMACIÓN (Azul):        #2196F3
├─ RGB: 33, 150, 243
└─ Uso: Mensajes informativos, links
```

### Paleta Secundaria
```
GRIS CLARO (Fondos):       #F5F5F5
├─ RGB: 245, 245, 245
└─ Uso: Fondos de tarjetas, áreas secundarias

GRIS MEDIO (Bordes):       #D0D0D0
├─ RGB: 208, 208, 208
└─ Uso: Líneas divisoras, bordes sutiles

GRIS TEXTO (Secundario):   #757575
├─ RGB: 117, 117, 117
└─ Uso: Texto de menor importancia
```

---

## PARTE 5: ESTRUCTURA DE PANTALLAS (12 Principales)

### 1. LOGIN / AUTENTICACIÓN
**Elementos:**
- Logo RM Centro de Entrenamiento
- Campo usuario/email
- Campo contraseña
- Botón "Ingresar" (Naranja)
- Link "Olvide contraseña"
- Indicador de rol (Profesor/Alumno)

**Validaciones:**
- Usuario requerido
- Contraseña mínimo 6 caracteres
- Mensaje de error en rojo

---

### 2. DASHBOARD PROFESOR
**Secciones:**
```
┌─ HEADER ─────────────────────────┐
│ Logo | Nombre Profesor | Logout  │
├──────────────────────────────────┤
│ KPIs PRINCIPALES (Tarjetas)      │
│ ┌─────────────┬─────────┬─────┐ │
│ │ Alumnos Act.│Cuotas   │Asis.│ │
│ │     24      │3 Vencidas│87% │ │
│ └─────────────┴─────────┴─────┘ │
├──────────────────────────────────┤
│ ALERTAS (Cuotas próximas/vencidas)│
│ 🔴 Juan García - Vencida hace 5d  │
│ 🟡 María López - Vence en 2 días  │
├──────────────────────────────────┤
│ ACCIONES RÁPIDAS (Botones)       │
│ [+ Nuevo Alumno] [Registrar Pago]│
│ [Crear Rutina]   [Ver Estadísticas]
└──────────────────────────────────┘
```

---

### 3. PANEL DEL ALUMNO
**Secciones:**
```
┌─ HEADER ─────────────────────────┐
│ Logo | Hola, {Nombre} | Logout  │
├──────────────────────────────────┤
│ ESTADO DE CUOTA (Prominente)     │
│ ┌─────────────────────────────┐ │
│ │ 🟢 AL DÍA                   │ │
│ │ Próximo pago: 15 de Agosto  │ │
│ │ Monto: $2,500               │ │
│ └─────────────────────────────┘ │
├──────────────────────────────────┤
│ ACCESO RÁPIDO                    │
│ [Mi Rutina] [Mis Asistencias]   │
│ [Reservar Clase] [Mi Progreso]  │
├──────────────────────────────────┤
│ PRÓXIMAS CLASES RESERVADAS       │
│ • Musculación - Lunes 18:00      │
│ • Cardio - Miércoles 19:00       │
└──────────────────────────────────┘
```

---

### 4. LISTA DE ALUMNOS
**Tabla/Listado:**
```
┌─────────────────────────────────────────────┐
│ ALUMNOS - [Buscar...] [Filtrar v]           │
├─────────────────────────────────────────────┤
│ Nombre  │ Email      │ Cuota    │ Acciones│
├─────────────────────────────────────────────┤
│ Juan    │juan@email  │ 🟢 Al día│[👁][✏️][🗑]│
│ María   │maria@email │ 🔴 Vencida│[👁][✏️][🗑]│
│ Carlos  │carlos@e    │ 🟡 Por vencer│[...] │
└─────────────────────────────────────────────┘
[+ Nuevo Alumno]
```

---

### 5. PERFIL DEL ALUMNO
**Secciones:**
```
┌─ INFORMACIÓN PERSONAL ─┐
│ Nombre, Email, Teléfono│
│ Edad, Género, Objetivo │
└────────────────────────┘

┌─ ESTADO DE CUOTA ──────┐
│ Historial de pagos     │
│ Próximo vencimiento    │
│ Botón: [Registrar Pago]│
└────────────────────────┘

┌─ RUTINA ASIGNADA ──────┐
│ [Ver rutina actual]    │
│ [Historial de rutinas] │
└────────────────────────┘

┌─ FOTOS DE PROGRESO ────┐
│ Galería (antes/después)│
│ [+ Subir foto]         │
└────────────────────────┘
```

---

### 6. CONTROL DE CUOTAS
**Vista Crítica:**
```
┌─ FILTROS ─────────────┐
│ [Estado v] [Mes v]    │
└────────────────────────┘

RESUMEN:
🟢 Al día: 21 alumnos
🟡 Por vencer: 2 alumnos
🔴 Vencidas: 3 alumnos

┌─ DETALLE ─────────────────────────────┐
│ Alumno  │ Estado │ Vence │ Monto      │
├─────────────────────────────────────────┤
│ Juan    │ 🔴    │ -5d  │ $2,500     │
│ María   │ 🟡    │ +2d  │ $2,500     │
│ Carlos  │ 🟢    │ +25d │ $2,500     │
└─────────────────────────────────────────┘

[Enviar Recordatorios] [Generar Reporte]
```

---

### 7. GESTIÓN DE RUTINAS
**Estructura:**
```
┌─ LISTADO DE RUTINAS ──────┐
│ Rutina A (5 ejercicios)   │
│ Rutina B (8 ejercicios)   │
│ [+ Nueva Rutina]          │
└───────────────────────────┘

┌─ DETALLE DE RUTINA ───────────┐
│ Nombre: Rutina Musculación    │
│                               │
│ EJERCICIOS:                   │
│ 1. Press Banca               │
│    - Series: 4               │
│    - Reps: 8-10              │
│    - Peso: 80kg              │
│    - Obs: Aumentar a 85kg    │
│                               │
│ 2. Sentadillas               │
│    [Similar estructura]       │
│                               │
│ [+ Agregar Ejercicio]         │
│ [Guardar] [Eliminar]          │
└───────────────────────────────┘
```

---

### 8. ASISTENCIA
**Profesor:**
```
┌─ REGISTRAR ASISTENCIA ────┐
│ Clase: Musculación        │
│ Fecha: 18/08/2024         │
│ Hora: 18:00               │
│                           │
│ ALUMNOS PRESENTES:        │
│ ☑ Juan García             │
│ ☑ María López             │
│ ☐ Carlos Pérez            │
│                           │
│ [Guardar]                 │
└───────────────────────────┘
```

**Alumno:**
```
┌─ MIS ASISTENCIAS ─────────────┐
│ Mes: Agosto 2024              │
│                               │
│ Total asistencias: 16/20 (80%)│
│                               │
│ Historial:                    │
│ 18/08 ✓ Musculación 18:00     │
│ 16/08 ✓ Cardio 19:00          │
│ 14/08 ✗ No asistió            │
│                               │
│ Racha actual: 3 días          │
└───────────────────────────────┘
```

---

### 9. SISTEMA DE RESERVAS
**Calendario:**
```
┌─ RESERVAR CLASE ──────────────────┐
│ Tipo de clase: [Musculación v]    │
│                                   │
│ Lunes    │ Martes  │ Miércoles   │
│ 18:00 ✓  │ 18:00 ○ │ 18:00 ✗    │
│ 19:00 ✓  │ 19:00 ✓ │ 19:00 ✓    │
│ 20:00 ○  │ 20:00 ○ │ 20:00 ✓    │
│          │         │             │
│ ✓ Disponible (click para reservar)│
│ ○ Completo                       │
│ ✗ No disponible                  │
│                                   │
│ [Mis Reservas] [Cancelar]        │
└───────────────────────────────────┘
```

---

### 10. ESTADÍSTICAS
**Gráficos Principales:**
```
┌─ ALUMNOS POR MES (Gráfico línea) ┐
│ 25┤         ╱╲                    │
│   │      ╱      ╲                 │
│   │  ╱              ╲             │
│ 15┤╱─────────────────╲            │
│   └─────────────────────────────  │
│   Ene Feb Mar Abr May Jun         │

┌─ RECAUDACIÓN (Gráfico barras)    ┐
│ $80k┤    ████                     │
│     │ ████ ████ ████ ████         │
│ $40k┤ ████ ████ ████ ████         │
│     └────────────────────────────  │
│     Ene  Feb  Mar  Abr            │

┌─ CUOTAS (Donut chart)            ┐
│     🟢 21 Al día (70%)            │
│     🟡 2 Por vencer (7%)          │
│     🔴 3 Vencidas (10%)           │
│     ⚪ 3 De baja (13%)             │
└──────────────────────────────────┘
```

---

### 11. NOTIFICACIONES
**Centro de Notificaciones:**
```
┌─ NOTIFICACIONES ──────────────────┐
│ [Todas] [No leídas] [Alertas]     │
├───────────────────────────────────┤
│ 🔴 URGENT: 3 cuotas vencidas      │
│   Juan García, María López...      │
│   Hace 2 días                     │
│                                   │
│ 🟡 Recordatorio de pago            │
│   A Carlos Pérez: Vence en 3 días │
│   Hace 1 día                      │
│                                   │
│ 💪 Mensaje de motivación          │
│   ¡Buena semana, sigue así!      │
│   Hace 2 días                     │
│                                   │
│ 📢 Promoción especial             │
│   20% desc. nuevos miembros       │
│   Hace 5 días                     │
└───────────────────────────────────┘
```

---

### 12. CONFIGURACIÓN
**Admin:**
```
┌─ CONFIGURACIÓN GENERAL ───────┐
│ ► Datos del gimnasio           │
│ ► Horarios de clases           │
│ ► Montos de cuotas             │
│ ► Períodos de facturación      │
│ ► Métodos de pago              │
│ ► Backup de base de datos      │
│ ► Usuarios y permisos          │
└───────────────────────────────┘

**Alumno:**
┌─ CONFIGURACIÓN PERSONAL ──────┐
│ Cambiar contraseña             │
│ Preferencias de notificaciones │
│ Datos personales               │
│ Eliminar cuenta                │
└───────────────────────────────┘
```

---

### 13. GESTIÓN DE PROFESORES (NUEVO)
```
┌─ LISTADO DE PROFESORES ───────────────────────┐
│ Nombre    │ Especialidades      │ Turno │ Acc │
├────────────────────────────────────────────────┤
│ Diego M.  │ Musculación, GAP    │ Tarde │[👁][✏️]│
│ Sofía R.  │ Spinning, CrossFit  │ Noche │[👁][✏️]│
└────────────────────────────────────────────────┘
[+ Nuevo Profesor]

┌─ FICHA DE PROFESOR ───────────┐
│ Datos personales               │
│ Especialidades (multi-select)  │
│ Turnos asignados                │
│ Clases que dicta                │
│ [Ver asistencia]                │
└────────────────────────────────┘
```

---

### 14. ASISTENCIA DE PROFESORES (NUEVO)
```
┌─ ASISTENCIA DE PROFESORES ────────────────┐
│ [Filtrar por profesor v] [Mes v]          │
├─────────────────────────────────────────────┤
│ Profesor │ Fecha │ Entrada │ Salida │ Estado│
├─────────────────────────────────────────────┤
│ Diego M. │ 18/08 │ 17:58   │ 20:05  │ 🟢   │
│ Sofía R. │ 18/08 │ 20:15   │ 22:00  │ 🟡 Tarde│
└─────────────────────────────────────────────┘
[Registrar fichada manual] [Reporte de puntualidad]
```

---

### 16. COMPROBANTE DE PAGO (NUEVO)
```
┌─ REGISTRAR PAGO ──────────┐    ┌─ COMPROBANTE GENERADO ────────────┐
│ Alumno, cuota, monto,     │───▶│ Centro RM | Nº 2026-000184        │
│ fecha, medio de pago      │    │ Alumno, plan, período, prorrateo  │
│ [Guardar y Generar        │    │ Monto total, medio de pago        │
│  Comprobante]             │    │ [Descargar PDF] [WhatsApp][Email] │
└────────────────────────────┘    └────────────────────────────────────┘
```
Al guardar un pago se genera automáticamente un comprobante numerado (no es factura
fiscal, es un recibo interno) con el detalle del período facturado — incluyendo si fue
prorrateado y el cálculo — y se puede descargar en PDF o enviar directo al alumno por
WhatsApp o email desde la misma pantalla.

---

### 15. GESTIÓN DE PLANES Y PRECIOS (NUEVO)
```
┌─ CATÁLOGO DE PLANES ──────────────────────────┐
│ Plan                          │ Frec.│ Precio  │
├──────────────────────────────────────────────────┤
│ Musculación 3x semana         │ 3x   │ $15.000 │
│ Musculación Libre             │ Libre│ $22.000 │
│ Spinning 2x semana            │ 2x   │ $12.000 │
│ CrossFit 3x semana            │ 3x   │ $20.000 │
│ GAP 2x semana                 │ 2x   │ $11.000 │
└──────────────────────────────────────────────────┘
[+ Nuevo Plan]  [Ver historial de precios]
```

---

## PARTE 6: SISTEMA DE COMPONENTES Y PATRONES

### Componentes Reutilizables
```
1. BOTONES
   - Primario: Naranja (#E8973A) - Acciones principales
   - Secundario: Gris (#2C3E40) - Acciones secundarias
   - Peligro: Rojo (#F44336) - Eliminar, cancelar

2. TARJETAS
   - Fondo blanco/gris claro
   - Sombra suave
   - Borde superior en Naranja (opcional)

3. ALERTAS/BADGES
   - 🟢 Verde: Positivo
   - 🟡 Amarillo: Advertencia
   - 🔴 Rojo: Crítico
   - 🔵 Azul: Información

4. TABLAS
   - Header gris oscuro (#2C3E40) con texto blanco
   - Filas alternadas (blanco/gris claro)
   - Acciones al final (iconos Naranja)

5. MODALES
   - Fondo semi-oscuro (overlay)
   - Centro blanco
   - Título en Naranja
   - Botones acción en Naranja

6. INPUTS
   - Borde gris claro
   - Focus: Borde Naranja
   - Label arriba o dentro
   - Error: Texto rojo

7. NAVBAR/SIDEBAR
   - Fondo gris oscuro (#2C3E40)
   - Texto blanco
   - Items activos con fondo Naranja
   - Logo en la parte superior
```

---

## PARTE 7: FLUJOS DE INTERACCIÓN CRÍTICOS

### Flujo 1: Registrar Nuevo Pago (Admin)
```
Dashboard Admin
     ↓
[Registrar Pago] (Botón Naranja)
     ↓
Modal "Nuevo Pago"
├─ Seleccionar alumno (dropdown)
├─ Monto (input)
├─ Fecha (date picker)
├─ Medio de pago (radio: Efectivo/Transferencia)
├─ Referencia (input opcional)
└─ [Guardar] [Cancelar]
     ↓
Validaciones:
├─ Alumno requerido
├─ Monto > 0
└─ Fecha válida
     ↓
Éxito: 
├─ Toast "Pago registrado"
├─ Actualizar estado de cuota (🟢)
├─ Generar Comprobante de Pago numerado (ver pantalla 16)
├─ Ofrecer envío inmediato del comprobante por WhatsApp / Email
└─ Enviar notificación al alumno
```

### Flujo 2: Alumno Consulta Estado de Cuota
```
Dashboard Alumno
     ↓
[Estado de Cuota] (tarjeta prominente)
     ↓
Mostrar:
├─ Estado visual (🟢🟡🔴)
├─ Próxima fecha de vencimiento
├─ Monto
└─ Historial de últimos 3 pagos
     ↓
Botón: [Ver historial completo]
```

### Flujo 3: Admin Crea Rutina
```
Dashboard Admin
     ↓
[Crear Rutina] (Botón Naranja)
     ↓
Formulario:
├─ Nombre de rutina
├─ Descripción
└─ [+ Agregar Ejercicio]
     ↓
Para cada ejercicio:
├─ Nombre (dropdown de BD)
├─ Series
├─ Repeticiones
├─ Peso
├─ Observaciones
└─ [Eliminar ejercicio]
     ↓
[Guardar rutina]
     ↓
Éxito:
├─ Toast "Rutina creada"
├─ Disponible para asignar
└─ Listar en gestión de rutinas
```

---

## PARTE 8: ESPECIFICACIONES TÉCNICAS DE DISEÑO

### Tipografía
```
Familia: Sans-serif moderna
- Títulos: Bold 24px - 32px
- Subtítulos: SemiBold 18px - 20px
- Cuerpo: Regular 14px - 16px
- Pequeño: Regular 12px
- Monoespaciado (datos): 13px

Line height: 1.5 (texto) / 1.2 (títulos)
```

### Espaciado
```
Sistema de grilla: 8px base
├─ xs: 4px (entre elementos)
├─ sm: 8px (espacios pequeños)
├─ md: 16px (espacios normales)
├─ lg: 24px (espacios grandes)
└─ xl: 32px (espacios muy grandes)
```

### Bordes y Esquinas
```
Bordes sutiles: 1px #D0D0D0
Radio de esquina: 4px (inputs, botones) / 8px (tarjetas)
Sombras: 0 2px 8px rgba(0,0,0,0.1) (tarjetas)
```

### Responsive
```
Desktop: 1920px - 1280px
Tablet: 768px - 1024px
Mobile: 320px - 767px

Breakpoints:
- xs: 320px
- sm: 640px
- md: 1024px
- lg: 1280px
- xl: 1920px
```

---

## PARTE 9: PRIORIZACIÓN DE PANTALLAS (MVP)

### Fase 1 (Semana 1-2) - CRÍTICA
```
✓ Login
✓ Dashboard Profesor/Admin (básico)
✓ Gestión de Planes y Precios (catálogo base)
✓ Gestión de Profesores (alta + especialidades + turnos)
✓ Lista de Alumnos (CRUD + inscripción a plan)
✓ Control de Cuotas (visualización + registrar pago + prorrateo)
✓ Dashboard Alumno (estado cuota + rutina)
```

### Fase 2 (Semana 3-4) - IMPORTANTE
```
✓ Sistema de Rutinas
✓ Registro de Asistencia (Alumnos)
✓ Asistencia de Profesores
✓ Reserva de Clases
✓ Notificaciones básicas
```

### Fase 3 (Semana 5-6) - COMPLEMENTARIA
```
✓ Seguimiento de Progreso (fotos)
✓ Estadísticas avanzadas
✓ Configuración completa
✓ Reportes personalizados
```

---

## PARTE 10: PAUTAS DE IMPLEMENTACIÓN PARA STITCH

### 1. Color Variables (CSS/Tokens)
```css
:root {
  --color-primary: #E8973A;
  --color-secondary: #2C3E40;
  --color-background: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-border: #D0D0D0;
  --color-text: #2C3E40;
  --color-text-secondary: #757575;
  
  --color-success: #4CAF50;
  --color-warning: #FFC107;
  --color-error: #F44336;
  --color-info: #2196F3;
}
```

### 2. Componentes Base
```
- Button (variant: primary, secondary, danger)
- Card (base, elevated, outlined)
- Table (with sorting, pagination)
- Modal (alert, form, confirmation)
- Toast/Notification
- Badge (status: success, warning, error, info)
- Input (text, email, password, date, number)
- Select/Dropdown
- Checkbox/Radio
- Tabs
- Alert Box
```

### 3. Iconografía
```
Recomendación: Font Awesome o Material Icons
- Acción: añadir, editar, eliminar, ver, descargar
- Estados: carga, éxito, error, advertencia
- Navegación: menú, atrás, siguiente, inicio
- Utilidad: búsqueda, filtro, settings, notificación
```

### 4. Validación y Errores
```
- Campos requeridos: asterisco rojo *
- Error inline: texto rojo bajo el input
- Error global: alert box rojo en header
- Toast de éxito: fondo verde, desaparece en 3s
- Toast de error: fondo rojo, permanente hasta cerrar
```

### 5. Consistencia
```
✓ Usar variables de color en todos lados
✓ Mantener espaciado consistente
✓ Reutilizar componentes (no duplicar)
✓ Iconografía uniforme
✓ Tipografía en escala definida
```

---

## PARTE 11: PRÓXIMOS PASOS

1. **Stitch Phase**: Crear sistema de componentes de diseño
2. **Validación**: Review de paleta con R.I Centro
3. **Desarrollo**: Frontend con componentes Stitch
4. **Backend**: APIs para cada módulo
5. **Testing**: UI/UX testing con usuario final
6. **Deploy**: Hosting y mantenimiento

---

*Design Brief - RM Centro de Entrenamiento*  
*Preparado para modelado de sistema completo*  
*Última actualización: 2024*
