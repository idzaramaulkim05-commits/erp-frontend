import React, { useState } from 'react';
import {
  Columns,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { InterDivisionTask } from '../../types';

interface InterDivisionKanbanViewProps {
  onOpenNewTask: () => void;
}

export const InterDivisionKanbanView: React.FC<InterDivisionKanbanViewProps> = ({
  onOpenNewTask,
}) => {
  const { tasks, updateTaskStatus, searchQuery } = useIOMS();

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.fromDivision.toLowerCase().includes(q) ||
        t.toDivision.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const columns: { id: 'todo' | 'in_progress' | 'review' | 'done'; title: string; color: string }[] = [
    { id: 'todo', title: '1. Antrian Tugas (To-Do)', color: 'border-slate-300 text-slate-700 bg-slate-100' },
    { id: 'in_progress', title: '2. Sedang Dikerjakan', color: 'border-sky-300 text-sky-800 bg-sky-50' },
    { id: 'review', title: '3. Menunggu Review Divisi Pengaju', color: 'border-purple-300 text-purple-800 bg-purple-50' },
    { id: 'done', title: '4. Selesai & Terverifikasi', color: 'border-emerald-300 text-emerald-800 bg-emerald-50' },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded">URGENT</span>;
      case 'high':
        return <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">HIGH</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">{priority}</span>;
    }
  };

  const getNextStatus = (current: 'todo' | 'in_progress' | 'review' | 'done') => {
    switch (current) {
      case 'todo': return 'in_progress';
      case 'in_progress': return 'review';
      case 'review': return 'done';
      default: return 'done';
    }
  };

  const getPrevStatus = (current: 'todo' | 'in_progress' | 'review' | 'done') => {
    switch (current) {
      case 'done': return 'review';
      case 'review': return 'in_progress';
      case 'in_progress': return 'todo';
      default: return 'todo';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner explaining why this module solves communication gaps */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Columns className="w-4 h-4 text-purple-600" />
            <span>Papan Koordinasi Tugas Antar-Divisi (Kanban Board)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Mencegah miskomunikasi internal lisan/telepon. Setiap koordinasi tercatat rapi dengan tenggat waktu.
          </p>
        </div>

        <button
          onClick={onOpenNewTask}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Task / Laporan Internal</span>
        </button>
      </div>

      {/* 4-Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">{col.title}</span>
                <span className="text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-slate-300 shadow-xs space-y-2.5 transition-all"
                  >
                    {/* Top tags */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {task.id}
                      </span>
                      {getPriorityBadge(task.priority)}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{task.description}</p>

                    {/* Routing metadata (From Divisi -> To Divisi) */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] text-slate-600 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{task.fromDivision}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-emerald-800">{task.toDivision}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Due: {task.dueDate}</span>
                      <span>By: {task.createdBy.split(' ')[0]}</span>
                    </div>

                    {/* Stage Moving Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      {col.id !== 'todo' ? (
                        <button
                          onClick={() => updateTaskStatus(task.id, getPrevStatus(task.status))}
                          className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 p-1 flex items-center gap-0.5"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Mundur</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      {col.id !== 'done' && (
                        <button
                          onClick={() => {
                            const next = getNextStatus(task.status);
                            const notes = next === 'done' ? prompt('Catatan penyelesaian tugas:') : undefined;
                            updateTaskStatus(task.id, next, notes || undefined);
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 p-1 flex items-center gap-0.5"
                        >
                          <span>{col.id === 'review' ? 'Selesaikan (Done)' : 'Lanjut →'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
