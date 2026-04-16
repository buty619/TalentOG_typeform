const authToken = process.env.AUTH_TOKEN;
const apiUrl = process.env.API_URL;

async function getWorkspaces(workspace) {
  console.log('[GET_WORKSPACE]: START - ', workspace);
  const targetUrl = `${apiUrl}/workspaces/${workspace}/forms?page_size=200`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.code) {
      console.error(`[GET_WORKSPACE]: ERROR - `, data.code);
      return { error: data.code };
    }
    console.log(
      `[GET_WORKSPACE]: SUCCESS - ${workspace}: items on workspace ${data?.items?.length}`,
    );
    return data;
  } catch (error) {
    console.error(`[GET_WORKSPACE]: ERROR - `, error);
    return { error };
  }
}

async function getFormDefinition(formId) {
  console.log(`[GET_FORM_DEF]: START - ${formId}`);
  const targetUrl = `${apiUrl}/forms/${formId}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log(
      `[GET_FORM_DEF]: SUCCESS - ${formId}: ${data.fields?.length} fields`,
    );
    return data.fields || [];
  } catch (error) {
    console.error(`[GET_FORM_DEF]: ERROR - ${formId}`, error);
    return [];
  }
}

async function getForms(formId, title) {
  console.log(`[GET_FORMS]: START - ${formId}: ${title}`);

  if (!formId) {
    console.error('[GET_FORMS]: ERROR - Missing formId parameter');
    return [];
  }
  const targetUrl = `${apiUrl}/forms/${formId}/responses?page_size=1000`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log(
      `[GET_FORMS]: SUCCESS - ${formId}: ${title}, Total Responses: ${data.items.length}`,
    );
    return data;
  } catch (error) {
    console.error(`[GET_FORMS]: ERROR - ${formId}: ${title}`, error);
    return [];
  }
}

async function fetchAllResponses(req, res) {
  const { workspaceId } = req.query;
  const { items, error } = await getWorkspaces(workspaceId);
  if (error) {
    console.log(`[GET_ALL_RESPONSES]: ERROR - ${error}`);
    res.status(400).json({ error });
    return;
  }
  try {
    const responses = await Promise.all(
      items?.map(async (item) => {
        const [data, fields] = await Promise.all([
          getForms(item.id, item.title),
          getFormDefinition(item.id),
        ]);

        // Normalize: ensure every response has an answer for every field,
        // in the same order as the form definition
        const normalizedItems = (data.items || []).map((responseItem) => {
          const answerMap = new Map(
            responseItem.answers.map((a) => [a.field.id, a])
          );
          const normalizedAnswers = fields.map((field) =>
            answerMap.get(field.id) || {
              type: field.type,
              text: '—',
              field: { id: field.id, type: field.type, ref: field.ref },
            }
          );
          return { ...responseItem, answers: normalizedAnswers, title: item.title };
        });

        return normalizedItems;
      }),
    );

    const processData = responses.flat();
    console.log(`[GET_ALL_RESPONSES]: SUCCESS - `, processData.length);
    res.status(200).json(processData);
  } catch (error) {
    console.log(`[GET_ALL_RESPONSES]: ERROR - `, error);
    res.status(400).json({ error });
  }
}

export default fetchAllResponses;
