import TradingViewWidget from '@/components/tradingview-components/chart'
import SearchCommand from '@/components/tradingview-components/search'
import { HEATMAP_WIDGET_CONFIG, MARKET_DATA_WIDGET_CONFIG, MARKET_OVERVIEW_WIDGET_CONFIG, TOP_STORIES_WIDGET_CONFIG } from '@/constants'

const StockMarket = () => {
  const scriptUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

  return (
    <div className="flex flex-col min-h-screen home-wrapper ml-5 mt-5">
      <section className="w-full mb-6">
        <div className="w-full flex items-center justify-center">
          <SearchCommand
            label="Search Stocks"
            renderAs="bar"
            initialStocks={[]}
          />
        </div>
      </section>
      <section className='grid w-full gap-8 home-section mr-5'>
        <div className='md:col-span-1 xl:col-span-1'>
          <TradingViewWidget
            title='Market Overview'
            scriptUrl={`${scriptUrl}market-overview.js`}
            config={MARKET_OVERVIEW_WIDGET_CONFIG}
            className='custom-chart'
            height={600}
          />
        </div>
        <div className='h-full md:col-span-1 xl:col-span-1'>
          <TradingViewWidget
            scriptUrl={`${scriptUrl}timeline.js`}
            config={TOP_STORIES_WIDGET_CONFIG}
            className='custom-chart'
            height={600}
          />
        </div>
      </section>
      <section className='grid w-full gap-8 home-section mr-5'>
        <div className='md:col-span-1 xl:col-span-2'>
          <TradingViewWidget
              title='Stock Heatmap'
              scriptUrl={`${scriptUrl}stock-heatmap.js`}
              config={HEATMAP_WIDGET_CONFIG}
              height={600}
            />
        </div>
        <div className='h-full md:col-span-1 xl:col-span-2'>
          <TradingViewWidget
              scriptUrl={`${scriptUrl}market-quotes.js`}
              config={MARKET_DATA_WIDGET_CONFIG}
              height={600}
            />
        </div>
      </section>
    </div>
  )
}

export default StockMarket