export const sidebarLinks = [
  {
    imgURL: "/icons/home.svg",
    route: "/",
    label: "Home",
  },
  {
    imgURL: "/icons/dollar-circle.svg",
    route: "/my-banks",
    label: "My Banks",
  },
  {
    imgURL: "/icons/transaction.svg",
    route: "/transaction-history",
    label: "Transaction History",
  },
  {
    imgURL: "/icons/money-send.svg",
    route: "/stock-market",
    label: "Stock Market",
  },
  {
    imgURL: "/icons/investment.svg",
    route: "/investments",
    label: "Investments",
  },
  {
    imgURL: "/icons/dollar.svg",
    route: "/savings",
    label: "Savings",
  },
  {
    imgURL: "/icons/credit-card.svg",
    route: "/bills-and-debts",
    label: "Bills & Debts",
  },
];

// good_user / good_password - Bank of America
export const TEST_USER_ID = "6627ed3d00267aa6fa3e";

// custom_user -> Chase Bank
// export const TEST_ACCESS_TOKEN =
//   "access-sandbox-da44dac8-7d31-4f66-ab36-2238d63a3017";

// custom_user -> Chase Bank
export const TEST_ACCESS_TOKEN =
  "access-sandbox-229476cf-25bc-46d2-9ed5-fba9df7a5d63";

export const ITEMS = [
  {
    id: "6624c02e00367128945e", // appwrite item Id
    accessToken: "access-sandbox-83fd9200-0165-4ef8-afde-65744b9d1548",
    itemId: "VPMQJKG5vASvpX8B6JK3HmXkZlAyplhW3r9xm",
    userId: "6627ed3d00267aa6fa3e",
    accountId: "X7LMJkE5vnskJBxwPeXaUWDBxAyZXwi9DNEWJ",
  },
  {
    id: "6627f07b00348f242ea9", // appwrite item Id
    accessToken: "access-sandbox-74d49e15-fc3b-4d10-a5e7-be4ddae05b30",
    itemId: "Wv7P6vNXRXiMkoKWPzeZS9Zm5JGWdXulLRNBq",
    userId: "6627ed3d00267aa6fa3e",
    accountId: "x1GQb1lDrDHWX4BwkqQbI4qpQP1lL6tJ3VVo9",
  },
];

export const topCategoryStyles = {
  "Food And Drink": {
    bg: "bg-pink-25",
    circleBg: "bg-pink-100",
    text: {
      main: "text-pink-700",
      count: "text-pink-600"
    },
    progress: {
      bg: "bg-pink-100",
      indicator: "bg-pink-500"
    },
    icon: "/icons/food.svg"
  },
  "Loan Payments": {
    bg: "bg-blue-25",
    circleBg: "bg-blue-100",
    text: {
      main: "text-blue-700",
      count: "text-blue-600"
    },
    progress: {
      bg: "bg-blue-100",
      indicator: "bg-blue-500"
    },
    icon: "/icons/loan.svg"
  },
  "Government And Non Profit": {
    bg: "bg-purple-25",
    circleBg: "bg-purple-100",
    text: {
      main: "text-purple-700",
      count: "text-purple-600"
    },
    progress: {
      bg: "bg-purple-100",
      indicator: "bg-purple-500"
    },
    icon: "/icons/government.svg"
  },
  "Transfer Out": {
    bg: "bg-gray-25",
    circleBg: "bg-gray-100",
    text: {
      main: "text-gray-700",
      count: "text-gray-600"
    },
    progress: {
      bg: "bg-gray-100",
      indicator: "bg-gray-500"
    },
    icon: "/icons/transfer-out.svg"
  },
  "General Merchandise": {
    bg: "bg-emerald-25",
    circleBg: "bg-emerald-100",
    text: {
      main: "text-emerald-700",
      count: "text-emerald-600"
    },
    progress: {
      bg: "bg-emerald-100",
      indicator: "bg-emerald-500"
    },
    icon: "/icons/general.svg"
  },
  "Personal Care": {
    bg: "bg-pink-25",
    circleBg: "bg-pink-100",
    text: {
      main: "text-pink-700",
      count: "text-pink-600"
    },
    progress: {
      bg: "bg-pink-100",
      indicator: "bg-pink-500"
    },
    icon: "/icons/personal-care.svg"
  },
  "Medical": {
    bg: "bg-sky-25",
    circleBg: "bg-sky-100",
    text: {
      main: "text-sky-700",
      count: "text-sky-600"
    },
    progress: {
      bg: "bg-sky-100",
      indicator: "bg-sky-500"
    },
    icon: "/icons/medical.svg"
  },
  "Entertainment": {
    bg: "bg-orange-25",
    circleBg: "bg-orange-100",
    text: {
      main: "text-orange-700",
      count: "text-orange-600"
    },
    progress: {
      bg: "bg-orange-100",
      indicator: "bg-orange-500"
    },
    icon: "/icons/entertainment.svg"
  },
  "Home Improvement": {
    bg: "bg-violet-25",
    circleBg: "bg-violet-100",
    text: {
      main: "text-violet-700",
      count: "text-violet-600"
    },
    progress: {
      bg: "bg-violet-100",
      indicator: "bg-violet-500"
    },
    icon: "/icons/furniture.svg"
  },
  "General Services": {
    bg: "bg-amber-25",
    circleBg: "bg-amber-100",
    text: {
      main: "text-amber-700",
      count: "text-amber-600"
    },
    progress: {
      bg: "bg-amber-100",
      indicator: "bg-amber-500"
    },
    icon: "/icons/service.svg"
  },
  "Bank Fees": {
    bg: "bg-red-25",
    circleBg: "bg-red-100",
    text: {
      main: "text-red-700",
      count: "text-red-600"
    },
    progress: {
      bg: "bg-red-100",
      indicator: "bg-red-500"
    },
    icon: "/icons/bank.svg"
  },
  "Income": {
    bg: "bg-green-25",
    circleBg: "bg-green-100",
    text: {
      main: "text-green-700",
      count: "text-green-600"
    },
    progress: {
      bg: "bg-green-100",
      indicator: "bg-green-500"
    },
    icon: "/icons/income.svg"
  },
  "Transfer In": {
    bg: "bg-green-25",
    circleBg: "bg-green-100",
    text: {
      main: "text-green-700",
      count: "text-green-600"
    },
    progress: {
      bg: "bg-green-100",
      indicator: "bg-green-500"
    },
    icon: "/icons/transfer-in.svg"
  },
  "Transportation": {
    bg: "bg-cyan-25",
    circleBg: "bg-cyan-100",
    text: {
      main: "text-cyan-700",
      count: "text-cyan-600"
    },
    progress: {
      bg: "bg-cyan-100",
      indicator: "bg-cyan-500"
    },
    icon: "/icons/car.svg"
  },
  "Travel": {
    bg: "bg-cyan-25",
    circleBg: "bg-cyan-100",
    text: {
      main: "text-cyan-700",
      count: "text-cyan-600"
    },
    progress: {
      bg: "bg-cyan-100",
      indicator: "bg-cyan-500"
    },
    icon: "/icons/travel.svg"
  },
  "Rent And Utilities": {
    bg: "bg-lime-25",
    circleBg: "bg-lime-100",
    text: {
      main: "text-lime-700",
      count: "text-lime-600"
    },
    progress: {
      bg: "bg-lime-100",
      indicator: "bg-lime-500"
    },
    icon: "/icons/rent.svg"
  },
  Transfer: {
    bg: "bg-red-25",
    circleBg: "bg-red-100",
    text: {
      main: "text-red-700",
      count: "text-red-600"
    },
    progress: {
      bg: "bg-red-100",
      indicator: "bg-red-700"
    },
    icon: "/icons/transfer.svg"
  },
  default: {
    bg: "bg-blue-25",
    circleBg: "bg-blue-100",
    text: {
      main: "text-blue-700",
      count: "text-blue-600"
    },
    progress: {
      bg: "bg-blue-100",
      indicator: "bg-blue-500"
    },
    icon: "/icons/default.svg"
  }
}

export const transactionCategoryStyles = {
  "Loan Payments": {
    borderColor: "border-blue-600",
    backgroundColor: "bg-blue-500",
    textColor: "text-blue-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Government And Non Profit": {
    borderColor: "border-purple-600",
    backgroundColor: "bg-purple-500",
    textColor: "text-purple-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Transfer Out": {
    borderColor: "border-gray-600",
    backgroundColor: "bg-gray-500",
    textColor: "text-gray-700",
    chipBackgroundColor: "bg-inherit",
  },
  "General Merchandise": {
    borderColor: "border-emerald-600",
    backgroundColor: "bg-emerald-500",
    textColor: "text-emerald-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Personal Care": {
    borderColor: "border-pink-600",
    backgroundColor: "bg-pink-500",
    textColor: "text-pink-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Medical": {
    borderColor: "border-sky-600",
    backgroundColor: "bg-sky-500",
    textColor: "text-sky-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Entertainment": {
    borderColor: "border-orange-600",
    backgroundColor: "bg-orange-500",
    textColor: "text-orange-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Home Improvement": {
    borderColor: "border-violet-600",
    backgroundColor: "bg-violet-500",
    textColor: "text-violet-700",
    chipBackgroundColor: "bg-inherit",
  },
  "General Services": {
    borderColor: "border-amber-600",
    backgroundColor: "bg-amber-500",
    textColor: "text-amber-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Bank Fees": {
    borderColor: "border-red-600",
    backgroundColor: "bg-red-500",
    textColor: "text-red-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Income": {
    borderColor: "border-green-600",
    backgroundColor: "bg-green-500",
    textColor: "text-green-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Transfer In": {
    borderColor: "border-green-600",
    backgroundColor: "bg-green-500",
    textColor: "text-green-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Transportation": {
    borderColor: "border-cyan-600",
    backgroundColor: "bg-cyan-500",
    textColor: "text-cyan-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Rent And Utilities": {
    borderColor: "border-lime-600",
    backgroundColor: "bg-lime-500",
    textColor: "text-lime-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Food And Drink": {
    borderColor: "border-pink-600",
    backgroundColor: "bg-pink-500",
    textColor: "text-pink-700",
    chipBackgroundColor: "bg-inherit",
  },
  Transfer: {
    borderColor: "border-red-700",
    backgroundColor: "bg-red-700",
    textColor: "text-red-700",
    chipBackgroundColor: "bg-inherit",
  },
  Processing: {
    borderColor: "border-[#F2F4F7]",
    backgroundColor: "bg-gray-500",
    textColor: "text-[#344054]",
    chipBackgroundColor: "bg-[#F2F4F7]",
  },
  Success: {
    borderColor: "border-[#12B76A]",
    backgroundColor: "bg-[#12B76A]",
    textColor: "text-[#027A48]",
    chipBackgroundColor: "bg-[#ECFDF3]",
  },
  default: {
    borderColor: "",
    backgroundColor: "bg-blue-500",
    textColor: "text-blue-700",
    chipBackgroundColor: "bg-inherit",
  },
};

// TradingView Widget Configurations
export const MARKET_OVERVIEW_WIDGET_CONFIG = {
    colorTheme: 'light', // dark mode
    dateRange: '12M', // last 12 months
    locale: 'en', // language
    largeChartUrl: '', // link to a large chart if needed
    isTransparent: true, // makes background transparent
    showFloatingTooltip: true, // show tooltip on hover
    plotLineColorGrowing: '#0FEDBE', // line color when price goes up
    plotLineColorFalling: '#0FEDBE', // line color when price falls
    gridLineColor: 'rgba(240, 243, 250, 0)', // grid line color
    scaleFontColor: '#DBDBDB', // font color for scale
    belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)', // fill under line when growing
    belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)', // fill under line when falling
    belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
    belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
    symbolActiveColor: 'rgba(15, 237, 190, 0.05)', // highlight color for active symbol
    tabs: [
        {
            title: 'Financial',
            symbols: [
                { s: 'NYSE:JPM', d: 'JPMorgan Chase' },
                { s: 'NYSE:WFC', d: 'Wells Fargo Co New' },
                { s: 'NYSE:BAC', d: 'Bank Amer Corp' },
                { s: 'NYSE:HSBC', d: 'Hsbc Hldgs Plc' },
                { s: 'NYSE:C', d: 'Citigroup Inc' },
                { s: 'NYSE:MA', d: 'Mastercard Incorporated' },
            ],
        },
        {
            title: 'Technology',
            symbols: [
                { s: 'NASDAQ:AAPL', d: 'Apple' },
                { s: 'NASDAQ:GOOGL', d: 'Alphabet' },
                { s: 'NASDAQ:MSFT', d: 'Microsoft' },
                { s: 'NASDAQ:FB', d: 'Meta Platforms' },
                { s: 'NYSE:ORCL', d: 'Oracle Corp' },
                { s: 'NASDAQ:INTC', d: 'Intel Corp' },
            ],
        },
        {
            title: 'Services',
            symbols: [
                { s: 'NASDAQ:AMZN', d: 'Amazon' },
                { s: 'NYSE:BABA', d: 'Alibaba Group Hldg Ltd' },
                { s: 'NYSE:T', d: 'At&t Inc' },
                { s: 'NYSE:WMT', d: 'Walmart' },
                { s: 'NYSE:V', d: 'Visa' },
            ],
        },
    ],
    support_host: 'https://www.tradingview.com', // TradingView host
    backgroundColor: '#141414', // background color
    width: '100%', // full width
    height: 600, // height in px
    showSymbolLogo: true, // show logo next to symbols
    showChart: true, // display mini chart
};

export const HEATMAP_WIDGET_CONFIG = {
    dataSource: 'SPX500',
    blockSize: 'market_cap_basic',
    blockColor: 'change',
    grouping: 'sector',
    isTransparent: true,
    locale: 'en',
    symbolUrl: '',
    colorTheme: 'light',
    exchanges: [],
    hasTopBar: false,
    isDataSetEnabled: false,
    isZoomEnabled: true,
    hasSymbolTooltip: true,
    isMonoSize: false,
    width: '100%',
    height: '600',
};

export const TOP_STORIES_WIDGET_CONFIG = {
    displayMode: 'regular',
    feedMode: 'market',
    colorTheme: 'light',
    isTransparent: true,
    locale: 'en',
    market: 'stock',
    width: '100%',
    height: '600',
};

export const MARKET_DATA_WIDGET_CONFIG = {
    title: 'Stocks',
    width: '100%',
    height: 600,
    locale: 'en',
    showSymbolLogo: true,
    colorTheme: 'light',
    isTransparent: false,
    symbolsGroups: [
        {
            name: 'Financial',
            symbols: [
                { name: 'NYSE:JPM', displayName: 'JPMorgan Chase' },
                { name: 'NYSE:WFC', displayName: 'Wells Fargo Co New' },
                { name: 'NYSE:BAC', displayName: 'Bank Amer Corp' },
                { name: 'NYSE:HSBC', displayName: 'Hsbc Hldgs Plc' },
                { name: 'NYSE:C', displayName: 'Citigroup Inc' },
                { name: 'NYSE:MA', displayName: 'Mastercard Incorporated' },
            ],
        },
        {
            name: 'Technology',
            symbols: [
                { name: 'NASDAQ:AAPL', displayName: 'Apple' },
                { name: 'NASDAQ:GOOGL', displayName: 'Alphabet' },
                { name: 'NASDAQ:MSFT', displayName: 'Microsoft' },
                { name: 'NASDAQ:FB', displayName: 'Meta Platforms' },
                { name: 'NYSE:ORCL', displayName: 'Oracle Corp' },
                { name: 'NASDAQ:INTC', displayName: 'Intel Corp' },
            ],
        },
        {
            name: 'Services',
            symbols: [
                { name: 'NASDAQ:AMZN', displayName: 'Amazon' },
                { name: 'NYSE:BABA', displayName: 'Alibaba Group Hldg Ltd' },
                { name: 'NYSE:T', displayName: 'At&t Inc' },
                { name: 'NYSE:WMT', displayName: 'Walmart' },
                { name: 'NYSE:V', displayName: 'Visa' },
            ],
        },
    ],
};

export const SYMBOL_INFO_WIDGET_CONFIG = (symbol: string) => ({
    symbol: symbol.toUpperCase(),
    colorTheme: 'light',
    isTransparent: true,
    locale: 'en',
    width: '100%',
    height: 170,
});

export const CANDLE_CHART_WIDGET_CONFIG = (symbol: string) => ({
    allow_symbol_change: false,
    calendar: false,
    details: true,
    hide_side_toolbar: true,
    hide_top_toolbar: false,
    hide_legend: false,
    hide_volume: false,
    hotlist: false,
    interval: 'D',
    locale: 'en',
    save_image: false,
    style: 1,
    symbol: symbol.toUpperCase(),
    theme: 'light',
    timezone: 'Etc/UTC',
    backgroundColor: '#FFFFFF',
    gridColor: '#FFFFFF',
    watchlist: [],
    withdateranges: false,
    compareSymbols: [],
    studies: [],
    width: '100%',
    height: 600,
});

export const BASELINE_WIDGET_CONFIG = (symbol: string) => ({
    allow_symbol_change: false,
    calendar: false,
    details: false,
    hide_side_toolbar: true,
    hide_top_toolbar: false,
    hide_legend: false,
    hide_volume: false,
    hotlist: false,
    interval: 'D',
    locale: 'en',
    save_image: false,
    style: 10,
    symbol: symbol.toUpperCase(),
    theme: 'light',
    timezone: 'Etc/UTC',
    backgroundColor: '#FFFFFF',
    gridColor: '#FFFFFF',
    watchlist: [],
    withdateranges: false,
    compareSymbols: [],
    studies: [],
    width: '100%',
    height: 600,
});

export const TECHNICAL_ANALYSIS_WIDGET_CONFIG = (symbol: string) => ({
    symbol: symbol.toUpperCase(),
    colorTheme: 'light',
    isTransparent: 'true',
    locale: 'en',
    width: '100%',
    height: 400,
    interval: '1h',
    largeChartUrl: '',
});

export const COMPANY_FINANCIALS_WIDGET_CONFIG = (symbol: string) => ({
    symbol: symbol.toUpperCase(),
    colorTheme: 'light',
    isTransparent: 'true',
    locale: 'en',
    width: '100%',
    height: 464,
    displayMode: 'regular',
    largeChartUrl: '',
});

export const POPULAR_STOCK_SYMBOLS = [
    // Tech Giants (the big technology companies)
    'AAPL',
    'MSFT',
    'GOOGL',
    'AMZN',
    'TSLA',
    'META',
    'NVDA',
    'NFLX',
    'ORCL',
    'CRM',

    // Growing Tech Companies
    'ADBE',
    'INTC',
    'AMD',
    'PYPL',
    'UBER',
    'ZOOM',
    'SPOT',
    'SQ',
    'SHOP',
    'ROKU',

    // Newer Tech Companies
    'SNOW',
    'PLTR',
    'COIN',
    'RBLX',
    'DDOG',
    'CRWD',
    'NET',
    'OKTA',
    'TWLO',
    'ZM',

    // Consumer & Delivery Apps
    'DOCU',
    'PTON',
    'PINS',
    'SNAP',
    'LYFT',
    'DASH',
    'ABNB',
    'RIVN',
    'LCID',
    'NIO',

    // International Companies
    'XPEV',
    'LI',
    'BABA',
    'JD',
    'PDD',
    'TME',
    'BILI',
    'DIDI',
    'GRAB',
    'SE',
];

export const NO_MARKET_NEWS =
    '<p class="mobile-text" style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:#4b5563;">No market news available today. Please check back tomorrow.</p>';

export const WATCHLIST_TABLE_HEADER = [
    'Company',
    'Symbol',
    'Price',
    'Change',
    'Market Cap',
    'P/E Ratio',
    'Alert',
    'Action',
];