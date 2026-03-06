/**
 * Utilidad para el cálculo de Festivos Colombianos (Ley Emiliani)
 * y gestión de semanas de trabajo.
 */

export interface Holiday {
    date: string;
    name: string;
}

const getNextMonday = (date: Date): Date => {
    const day = date.getDay();
    const diff = (day === 0 ? 1 : 8 - day);
    date.setDate(date.getDate() + diff);
    return date;
};

export const getColombiaHolidays = (year: number): Holiday[] => {
    const holidays: Holiday[] = [];

    // Festivos Fijos
    const fixed = [
        { d: 1, m: 0, n: "Año Nuevo" },
        { d: 1, m: 4, n: "Día del Trabajo" },
        { d: 20, m: 6, n: "Grito de Independencia" },
        { d: 7, m: 7, n: "Batalla de Boyacá" },
        { d: 8, m: 11, n: "Inmaculada Concepción" },
        { d: 25, m: 11, n: "Navidad" },
    ];

    // Festivos que se mueven al siguiente lunes (Ley Emiliani)
    const emiliani = [
        { d: 6, m: 0, n: "Reyes Magos" },
        { d: 19, m: 2, n: "San José" },
        { d: 29, m: 5, n: "San Pedro y San Pablo" },
        { d: 15, m: 7, n: "Asunción de la Virgen" },
        { d: 12, m: 9, n: "Día de la Raza" },
        { d: 1, m: 10, n: "Todos los Santos" },
        { d: 11, m: 10, n: "Independencia de Cartagena" },
    ];

    fixed.forEach(h => {
        holidays.push({ date: new Date(year, h.m, h.d).toISOString().split('T')[0], name: h.n });
    });

    emiliani.forEach(h => {
        let date = new Date(year, h.m, h.d);
        if (date.getDay() !== 1) { // Si no es lunes, mover al siguiente
            date = getNextMonday(date);
        }
        holidays.push({ date: date.toISOString().split('T')[0], name: h.n });
    });

    // Nota: Para Simplificación se omiten Semana Santa y Corpus Christi que dependen de la Luna
    // pero pueden añadirse con el cálculo de la Pascua (Algoritmo de Butcher).

    return holidays;
};

export const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};
