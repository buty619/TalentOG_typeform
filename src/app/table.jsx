import React from 'react';

const ResponsesTable = ({ data }) => {
  console.log('data', data);
  return (
    <table
      border="1"
      cellPadding="8"
      style={{ width: '100%', borderCollapse: 'collapse' }}
    >
      <thead>
        <tr>
          {/* se obtiene el numero de respuestas del fomulario, paramobtener los
          titulos llamas a https://api.typeform.com/forms/VS1ER6yy en el campo
          fields se obtienen los titulos que suelen ser muy largos por eso no se
          usan */}
          <th className="border border-gray-300 min-w-[200px] h-[40px] px-3 py-2 align-top sticky top-0 bg-gray-100">
            Person
          </th>
          {data[0]?.answers.map(({ field: { id } }, index) => (
            <th
              key={id}
              className="border border-gray-300 min-w-[200px] h-[40px]  px-3 py-2 align-top sticky top-0 bg-gray-100"
            >
              {`Question ${index + 1}`}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((item, index) => {
          return (
            <tr key={index}>
              <td
                key={index}
                className="border border-gray-300 min-w-[200px] h-[80px] max-h-[80px] px-3 py-2 align-top"
              >
                {item.title || 'ERROR'}
              </td>
              {item?.answers.map((item, index) => (
                <td
                  key={index}
                  className="border border-gray-300 min-w-[200px] h-[80px] max-h-[80px] px-3 py-2 align-top"
                >
                  {item.text || item.choice?.label || '[ERROR]'}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ResponsesTable;
