'use client';
import Image from 'next/image';
import { useState } from 'react';
import Table from './table';
import { unparse } from 'papaparse';

export default function Home() {
  const [data, setData] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async () => {
    if (!inputValue) {
      setData({
        error: 'ADD_VALID_WORKSPACE_ID',
      });
    } else {
      setData([]);
      setInputValue('');

      const workSpacesID = inputValue
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length);

      const workSpacesData = await Promise.all(
        workSpacesID.map(async (inputValue) => {
          const response = await fetch(`/api/forms?workspaceId=${inputValue}`);
          return await response.json();
        })
      );

      const error = workSpacesData.find(({ error }) => error);

      if (error) {
        setData(error);
        return;
      }

      setData((data) => [...data, ...workSpacesData.flat()]);
    }
  };

  const handleDownload = () => {
    const processData = data.map(({ title, answers }) =>
      answers.reduce(
        (acc, item, index) => ({
          ...acc,
          [`Question ${index + 1}`]:
            item.text || item.choice?.label || '[ERROR]',
        }),
        { ['Question 0']: title }
      )
    );

    const csv = unparse(processData, {
      delimiter: ';',
    });
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col p-6 md:p-10 min-h-screen w-screen items-center">
      <main className="flex flex-col grow gap-4 md:gap-8 items-center w-full max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Image
            className="dark:invert"
            src="/Talent-Logo.png"
            alt="Talent logo"
            width={180}
            height={38}
            priority
          />
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 border-b border-gray-300 pb-2 text-center">
            Talent Group TypeForm Information Process
          </h1>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3">
          <input
            type="text"
            name="workspaceID"
            id="workspaceID"
            placeholder="workspace ID"
            value={inputValue}
            onChange={handleInputChange}
            className="w-[250px] px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Submit
          </button>
          {!!data?.length && (
            <button
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 ease-in-out transform hover:scale-105"
              onClick={handleDownload}
            >
              Exportar CSV
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center max-w-lg">
          Para agregar varios workspaces colocar su ID separado por una coma,
          ej: NhY5t2, vnvDcM. Asegurarse que todos los cuestionarios de cada
          workspace tengan la misma cantidad de preguntas.
        </p>

        {!!data?.length && (
          <div className="w-full border border-gray-300 rounded-lg shadow-sm p-4 bg-gray-50">
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                Total de respuestas: <span className="text-blue-600">{data.length}</span>
              </h2>
              <span
                className={`text-gray-500 text-xl transition-transform duration-200 ${showDetail ? 'rotate-180' : ''}`}
              >
                &#x25B2;
              </span>
            </button>
            {showDetail && (
              <table className="w-full border-collapse mt-3">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left bg-gray-100">Formulario</th>
                    <th className="border border-gray-300 px-3 py-2 text-right bg-gray-100 w-[120px]">Respuestas</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    data.reduce((acc, item) => {
                      acc[item.title] = (acc[item.title] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([title, count]) => (
                    <tr key={title}>
                      <td className="border border-gray-300 px-3 py-2">{title}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!!data?.length && (
          <div className="w-full overflow-auto border border-gray-300 rounded-lg shadow-sm">
            <Table data={data} />
          </div>
        )}
        {!!data?.error && <h1>{data.error}</h1>}
      </main>
      <footer className="py-4 flex gap-6 flex-wrap items-center justify-center">
        <p className="text-xs text-gray-300">
          CFBR-2025 ©
        </p>
      </footer>
    </div>
  );
}
