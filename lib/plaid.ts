import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

type PlaidEnvName = 'sandbox' | 'development' | 'production'

const resolvePlaidBasePath = (): string => {
    const raw = (process.env.PLAID_ENV ?? 'sandbox').toLowerCase().trim()
    const env = (raw === 'prod' ? 'production' : raw) as PlaidEnvName

    if (env === 'sandbox' || env === 'development' || env === 'production') {
        return PlaidEnvironments[env]
    }

    console.warn(
        `Invalid PLAID_ENV="${raw}". Falling back to sandbox. Expected sandbox|development|production.`
    )
    return PlaidEnvironments.sandbox
}

const configuration = new Configuration({
    basePath: resolvePlaidBasePath(),
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
            // Plaid recommends pinning an API version.
            'Plaid-Version': process.env.PLAID_VERSION ?? '2020-09-14',
        },
    },
})

export const plaidClient = new PlaidApi(configuration)