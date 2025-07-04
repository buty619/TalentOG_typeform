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
        { 0: title }
      )
    );

    const csv = unparse(processData, {
      delimiter: ';'
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/Talent-Logo.png"
          alt="Talent logo"
          width={180}
          height={38}
          priority
        />
        <h1>Talent Group TypeForm Information Process</h1>
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
        {!!data?.length && <Table data={data} />}
        {!!data?.error && <h1>{data.error}</h1>}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
