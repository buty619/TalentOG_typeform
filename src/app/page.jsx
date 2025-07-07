'use client';
import Image from 'next/image';
import { useState } from 'react';
import Table from './table';
import { unparse } from 'papaparse';

export default function Home() {
  const [data, setData] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = () => {
    if (!inputValue) {
      setData({
        error: '[GET_ALL_RESPONSES]: ERROR - add a valid workspace ID',
      });
    } else {
      setData([]);
      setInputValue('');
      const workSpacesID = inputValue
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length);

      workSpacesID.map((inputValue) => {
        fetch(`/api/forms?workspaceId=${inputValue}`)
          .then((res) => res.json())
          .then((res) => setData((data) => [...data, ...res]));
      });
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
    <div className="flex flex-col p-10 h-screen w-screen">
      <main className="flex flex-col grow gap-[14px] md:gap-[32px] row-start-2 items-center sm:items-start h-full w-full">
        <div className="flex justify-center items-center md:items-baseline gap-[30px]">
          <Image
            className="dark:invert"
            src="/Talent-Logo.png"
            alt="Talent logo"
            width={180}
            height={38}
            priority
          />
          <h1 className="sm:text-1xl md:text-2xl font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
            Talent Group TypeForm Information Process
          </h1>
        </div>
        <div className="flex flex-wrap justify-center items-baseline gap-[10px]">
          <input
            type="text"
            name="workspaceID"
            id="workspaceID"
            placeholder="workspace ID"
            value={inputValue}
            onChange={handleInputChange}
            className="max-w-[250px] px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
        <p className="text-xs text-gray-500">
          Para agregar varios workspaces colocar su ID separado por una coma,
          ej: NhY5t2, vnvDcM. Asegurarse que todos los cuestionarios de cada
          worspace tengan la misma cantidad de preguntas.
        </p>

        {!!data?.length && (
          <div className="w-full overflow-scroll border border-black rounded-lg shadow-sm">
            <Table data={data} />
          </div>
        )}
        {!!data?.error && <h1>{data.error}</h1>}
      </main>
      <footer className="py-4 row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p className="flex items-center gap-2 hover:underline hover:underline-offset-4 text-weight-700 text-xs text-gray-300">
          CB-2025 ©
        </p>
      </footer>
    </div>
  );
}
