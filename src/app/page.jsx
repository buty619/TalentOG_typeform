'use client';
import Image from 'next/image';
import { useState } from 'react';
import Table from './table';
import { unparse } from 'papaparse';

export default function Home() {
  const [data, setData] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState('workspace');
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFormMode = mode === 'form';

  const handleSubmit = async () => {
    if (loading) return;

    if (!inputValue.trim()) {
      setError(isFormMode ? 'Ingresa un ID de formulario válido' : 'Ingresa un ID de workspace válido');
      return;
    }

    setData([]);
    setError(null);
    setLoading(true);

    const ids = inputValue
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length);

    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const param = isFormMode ? `formId=${id}` : `workspaceId=${id}`;
          const response = await fetch(`/api/forms?${param}`);
          return await response.json();
        })
      );

      const apiError = results.find((r) => r.error);
      if (apiError) {
        setError(apiError.error);
        return;
      }

      setData(results.flat());
      setInputValue('');
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleDownload = () => {
    const headers = data[0].answers.map(
      (item, index) => `${index + 1}. ${item.field?.title || 'Pregunta'}`
    );
    const columns = ['Formulario', ...headers];

    const processData = data.map(({ title, answers }) => {
      const row = { Formulario: title };
      headers.forEach((key, index) => {
        const answer = answers[index];
        row[key] = answer
          ? answer.text || answer.choice?.label || '—'
          : '—';
      });
      return row;
    });

    const csv = unparse(processData, { delimiter: ';', columns });
    const BOM = '﻿';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reporte.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col p-6 md:p-10 min-h-screen w-screen items-center bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <main className="flex flex-col grow gap-4 md:gap-8 items-center w-full max-w-5xl">
        <div className="flex flex-col justify-center items-center gap-3">
          <Image
            className="dark:invert"
            src="/Talent-Logo.png"
            alt="Talent logo"
            width={180}
            height={38}
            priority
          />
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 pb-2 text-center">
            Procesamiento de Respuestas TypeForm
          </h1>
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => { setMode('workspace'); setData([]); setError(null); setInputValue(''); }}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              !isFormMode
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => { setMode('form'); setData([]); setError(null); setInputValue(''); }}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              isFormMode
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Formulario
          </button>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3">
          <input
            type="text"
            name="queryId"
            id="queryId"
            placeholder={isFormMode ? 'ID del formulario' : 'ID del workspace'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-[250px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-all duration-200"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
          {!!data.length && (
            <button
              className="px-6 py-2 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300 ease-in-out"
              onClick={handleDownload}
            >
              Exportar CSV
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-lg">
          {isFormMode
            ? 'Para agregar varios formularios colocar su ID separado por una coma, ej: abc123, def456.'
            : 'Para agregar varios workspaces colocar su ID separado por una coma, ej: NhY5t2, vnvDcM. Asegurarse que todos los cuestionarios de cada workspace tengan la misma cantidad de preguntas.'}
        </p>

        {error && (
          <div className="w-full max-w-lg px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Consultando respuestas...</span>
          </div>
        )}

        {!!data.length && (
          <div className="w-full border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm p-4 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Total de respuestas:{' '}
                <span className="text-blue-600 dark:text-blue-400">{data.length}</span>
              </h2>
              <span
                className={`text-gray-500 dark:text-gray-400 text-xl transition-transform duration-200 ${showDetail ? 'rotate-180' : ''}`}
              >
                &#x25B2;
              </span>
            </button>
            {showDetail && (
              <table className="w-full border-collapse mt-3">
                <thead>
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      Formulario
                    </th>
                    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-right bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-[120px]">
                      Respuestas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    data.reduce((acc, item) => {
                      acc[item.title] = (acc[item.title] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([title, count]) => (
                    <tr key={title} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">
                        {title}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                        {count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!!data.length && (
          <div className="w-full overflow-auto border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm">
            <Table data={data} />
          </div>
        )}
      </main>
      <footer className="py-4 flex gap-6 flex-wrap items-center justify-center">
        <p className="text-xs text-gray-300 dark:text-gray-600">
          CFBR-2025 &copy;
        </p>
      </footer>
    </div>
  );
}
