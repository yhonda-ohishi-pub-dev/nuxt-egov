export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.egovApiBase as string
  const path = getRouterParam(event, 'path') || ''
  const query = getQuery(event)

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) {
    throw createError({ statusCode: 401, message: 'No authorization header' })
  }

  const url = new URL(`${apiBase}/${path}`)
  for (const [k, v] of Object.entries(query)) {
    if (typeof v === 'string') {
      url.searchParams.set(k, v)
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': authHeader,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw createError({ statusCode: res.status, data })
  }

  return data
})
