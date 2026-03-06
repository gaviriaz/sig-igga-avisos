import React from 'react';
import { getColombiaHolidays, getWeekNumber, Holiday } from '../utils/colombiaCalendar';

interface TacticalCalendarProps {
    year: number;
}

const TacticalCalendar: React.FC<TacticalCalendarProps> = ({ year }) => {
    const holidays = getColombiaHolidays(year);
    const today = new Date();
    const currentMonth = today.getMonth();

    // Obtener días del mes actual
    const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, currentMonth, 1).getDay();

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const days = [];
    // Espacios vacíos para el inicio del mes
    for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const isHoliday = (day: number) => {
        const dateStr = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return holidays.find(h => h.date === dateStr);
    };

    return (
        <div className="glass rounded-[2.5rem] p-8 border-white/5 shadow-2xl animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                        Calendario <span className="text-primary">Táctico</span>
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Sincronizado: {monthNames[currentMonth]} {year} // Colombia Standard
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <span className="text-[9px] font-black uppercase text-slate-400">Festivo</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, idx) => (
                    <div key={`${d}-${idx}`} className="text-center text-[10px] font-black text-slate-600 uppercase py-2">{d}</div>
                ))}

                {days.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} className="h-12"></div>;

                    const holiday = isHoliday(day);
                    const isToday = day === today.getDate() && currentMonth === today.getMonth();

                    return (
                        <div
                            key={day}
                            className={`h-12 rounded-xl flex flex-col items-center justify-center relative transition-all group cursor-help ${holiday
                                ? 'bg-primary/20 border border-primary/30 text-primary'
                                : isToday
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'
                                    : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <span className="text-xs font-black">{day}</span>
                            {holiday && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping"></div>
                            )}

                            {/* Tooltip con nombre del festivo */}
                            {holiday && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                                    <div className="bg-slate-900 border border-primary/30 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xl">
                                        {holiday.name}
                                    </div>
                                    <div className="w-2 h-2 bg-slate-900 border-r border-b border-primary/30 rotate-45 mx-auto -mt-1"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <footer className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Semana Operativa</span>
                    <p className="text-xl font-black text-primary italic">W-{getWeekNumber(today)}</p>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-right block">Estatus de Ley</span>
                    <p className="text-[10px] font-bold text-slate-300">Emiliani 1.0 Enabled</p>
                </div>
            </footer>
        </div>
    );
};

export default TacticalCalendar;
