const authToken = process.env.AUTH_TOKEN;
const apiUrl = process.env.API_URL;

async function getWorkspaces(workspace) {
  console.log('[GET_WORKSPACE]: START - ', workspace);
  const targetUrl = `${apiUrl}/workspaces/${workspace}/forms?page_size=100`; // cambia a tu API real

  try {
    const response = await fetch(targetUrl, {
      method: 'GET', // o POST, etc.
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
      `[GET_WORKSPACE]: SUCCESS - ${workspace}: items  on workspace ${data?.items?.length}`
    );
    return data;
  } catch (error) {
    console.error(`[GET_WORKSPACE]: ERROR - `, error);
    return { error };
  }
}

async function getForms(formId, title) {
  console.log(`[GET_FORMS]: START - ${formId}: ${title}`);

  if (!formId) {
    console.error('[GET_FORMS]: ERROR - Missing formId parameter');
    return [];
  }
  const targetUrl = `${apiUrl}/forms/${formId}/responses`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET', // o POST, etc.
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log(`[GET_FORMS]: SUCCESS - ${formId}: ${title}`);
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
    console.log('error', error);
    res.status(500).json({
      error: `[GET_ALL_RESPONSES]: ERROR - ${error}`,
    });
    return;
  }
  try {
    const responses = await Promise.all(
      items?.map(async (item) => {
        const data = await getForms(item.id, item.title);

        if (res.length) {
          res.status(500).json({ error: 'Internal proxy error' });
        }

        return { ...data, title: item.title };
      })
    );

    const processData = responses.reduce(
      (acc, d) => [
        ...acc,
        ...d.items.map((item) => ({ ...item, title: d.title })),
      ],
      []
    );
    console.log(`[GET_ALL_RESPONSES]: SUCCESS - `, processData.length);
    res.status(200).json(processData);
  } catch (error) {
    console.log(`[GET_ALL_RESPONSES]: ERROR - `, error);
    res.status(500).json({ error: `[GET_ALL_RESPONSES]: ERROR - ${error}` });
  }
}

export default fetchAllResponses;
