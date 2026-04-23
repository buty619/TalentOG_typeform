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
    return { fields: data.fields || [], title: data.title || formId };
  } catch (error) {
    console.error(`[GET_FORM_DEF]: ERROR - ${formId}`, error);
    return { fields: [], title: formId };
  }
}

async function getForms(formId) {
  console.log(`[GET_FORMS]: START - ${formId}`);

  if (!formId) {
    console.error('[GET_FORMS]: ERROR - Missing formId parameter');
    return { items: [], total_items: 0 };
  }

  const allItems = [];
  let before = null;

  while (true) {
    const url = before
      ? `${apiUrl}/forms/${formId}/responses?page_size=1000&before=${before}`
      : `${apiUrl}/forms/${formId}/responses?page_size=1000`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.code) {
        console.error(`[GET_FORMS]: API ERROR - ${formId}: ${data.code}`);
        break;
      }

      const page = data.items || [];
      allItems.push(...page);

      console.log(
        `[GET_FORMS]: PAGE - ${formId}: fetched ${page.length}, total so far ${allItems.length}/${data.total_items}`,
      );

      if (page.length === 0 || allItems.length >= data.total_items) break;

      before = page[page.length - 1].token;
    } catch (error) {
      console.error(`[GET_FORMS]: ERROR - ${formId}`, error);
      break;
    }
  }

  console.log(`[GET_FORMS]: DONE - ${formId}: ${allItems.length} total responses`);
  return { items: allItems };
}

function normalizeResponses(items, fields, title) {
  return items.map((responseItem) => {
    const answerMap = new Map(
      responseItem.answers.map((a) => [a.field.id, a]),
    );
    const normalizedAnswers = fields.map((field) => {
      const answer = answerMap.get(field.id) || {
        type: field.type,
        text: '—',
        field: { id: field.id, type: field.type, ref: field.ref },
      };
      return {
        ...answer,
        field: { ...answer.field, title: field.title },
      };
    });
    return { ...responseItem, answers: normalizedAnswers, title };
  });
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
        const [data, { fields }] = await Promise.all([
          getForms(item.id),
          getFormDefinition(item.id),
        ]);
        return normalizeResponses(data.items || [], fields, item.title);
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

async function fetchFormResponses(req, res) {
  const { formId } = req.query;

  if (!formId) {
    res.status(400).json({ error: 'Missing formId parameter' });
    return;
  }

  console.log(`[FETCH_FORM]: START - ${formId}`);

  try {
    const [data, { fields, title }] = await Promise.all([
      getForms(formId),
      getFormDefinition(formId),
    ]);

    const processData = normalizeResponses(data.items || [], fields, title);
    console.log(`[FETCH_FORM]: SUCCESS - ${formId}: ${processData.length} responses`);
    res.status(200).json(processData);
  } catch (error) {
    console.error(`[FETCH_FORM]: ERROR - ${formId}`, error);
    res.status(400).json({ error: String(error) });
  }
}

export default function handler(req, res) {
  if (req.query.formId) return fetchFormResponses(req, res);
  return fetchAllResponses(req, res);
}
