const ResponsesTable = ({ data }) => {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="border border-gray-300 dark:border-gray-600 min-w-[160px] max-w-[300px] px-3 py-2 text-left text-xs font-semibold align-top sticky top-0 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            Formulario
          </th>
          {data[0]?.answers.map(({ field: { id, title } }, index) => (
            <th
              key={id}
              title={title}
              className="border border-gray-300 dark:border-gray-600 min-w-[180px] max-w-[300px] px-3 py-2 text-left text-xs font-semibold align-top sticky top-0 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 break-words"
            >
              {`${index + 1}. ${title || 'Pregunta'}`}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((item, index) => (
          <tr
            key={index}
            className="even:bg-gray-50 dark:even:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
          >
            <td className="border border-gray-300 dark:border-gray-600 min-w-[160px] max-w-[300px] px-3 py-2 align-top text-sm text-gray-700 dark:text-gray-300">
              {item.title || 'ERROR'}
            </td>
            {item?.answers.map((answer, answerIndex) => (
              <td
                key={answerIndex}
                className="border border-gray-300 dark:border-gray-600 min-w-[180px] max-w-[300px] px-3 py-2 align-top text-sm text-gray-700 dark:text-gray-300 break-words"
              >
                {answer.text || answer.choice?.label || '—'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ResponsesTable;
