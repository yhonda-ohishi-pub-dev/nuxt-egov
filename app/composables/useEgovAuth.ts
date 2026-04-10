interface TokenResponse {
  access_token: string
  expires_in: number
  refresh_expires_in: number
  refresh_token: string
  token_type: string
  id_token: string
  scope: string
}

export function useEgovAuth() {
  const config = useRuntimeConfig()
  const authBase = config.public.egovAuthBase as string

  const accessToken = useState<string | null>('egov_access_token', () => null)
  const refreshToken = useState<string | null>('egov_refresh_token', () => null)
  const tokenExpiresAt = useState<number>('egov_token_expires_at', () => 0)
  const isAuthenticated = computed(() => !!accessToken.value && Date.now() < tokenExpiresAt.value)

  async function startLogin() {
    const { codeVerifier, codeChallenge } = await generatePKCE()
    const state = crypto.randomUUID()

    sessionStorage.setItem('egov_code_verifier', codeVerifier)
    sessionStorage.setItem('egov_state', state)

    const clientId = config.public.egovClientId as string
    const redirectUri = config.public.egovRedirectUri as string

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'openid offline_access',
      redirect_uri: redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    window.location.href = `${authBase}/auth?${params}`
  }

  async function handleCallback(code: string, state: string) {
    const savedState = sessionStorage.getItem('egov_state')
    if (state !== savedState) {
      throw new Error('State mismatch - possible CSRF attack')
    }

    const codeVerifier = sessionStorage.getItem('egov_code_verifier')
    if (!codeVerifier) {
      throw new Error('Code verifier not found')
    }

    const redirectUri = config.public.egovRedirectUri as string

    const data = await $fetch<TokenResponse>('/api/egov/token', {
      method: 'POST',
      body: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      },
    })

    setTokens(data)
    sessionStorage.removeItem('egov_code_verifier')
    sessionStorage.removeItem('egov_state')
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) throw new Error('No refresh token')

    const data = await $fetch<TokenResponse>('/api/egov/token', {
      method: 'POST',
      body: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken.value,
      },
    })

    setTokens(data)
  }

  function setTokens(data: TokenResponse) {
    accessToken.value = data.access_token
    refreshToken.value = data.refresh_token
    tokenExpiresAt.value = Date.now() + data.expires_in * 1000
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    tokenExpiresAt.value = 0
  }

  async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
    if (!isAuthenticated.value && refreshToken.value) {
      await refreshAccessToken()
    }
    if (!accessToken.value) throw new Error('Not authenticated')

    return $fetch<T>(`/api/egov${path}`, {
      params,
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
      },
    })
  }

  return {
    accessToken: readonly(accessToken),
    isAuthenticated,
    startLogin,
    handleCallback,
    refreshAccessToken,
    logout,
    apiFetch,
  }
}
