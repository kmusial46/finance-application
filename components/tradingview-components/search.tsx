"use client"

import { useEffect, useState } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import {Button} from "@/components/ui/button";
import {Loader2,  TrendingUp, Search as SearchIcon} from "lucide-react";
import Link from "next/link";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {useDebounce} from "@/hooks/use-debounce";

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleSearch = async () => {
    if(!isSearchMode) return setStocks(initialStocks);

    setLoading(true)
    try {
        const results = await searchStocks(searchTerm.trim());
        setStocks(results);
    } catch {
      setStocks([])
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
  }

  return (
    <>
      {renderAs === 'text' ? (
        <span onClick={() => setOpen(true)} className="search-text">
          {label}
        </span>
      ) : renderAs === 'bar' ? (
        <div className="relative w-full max-w-96 px-4 sm:px-0">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="Search stocks..."
              className="w-full border border-gray-200 rounded-md px-3 pl-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm"
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />}
          </div>

          {open && (displayStocks && displayStocks.length > 0) && (
            <div className="absolute left-0 z-50 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white shadow-lg">
              <ul>
                {displayStocks.map((stock) => (
                  <li key={stock.symbol}>
                    <Link
                      href={`/stocks/${stock.symbol}`}
                      onClick={() => handleSelectStock()}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50"
                    >
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{stock.name}</div>
                        <div className="text-xs text-gray-500">{stock.symbol} | {stock.exchange}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <Button onClick={() => setOpen(true)} className="search-btn">
          {label}
        </Button>
      )}
      {renderAs !== 'bar' && (
        <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
          <div className="search-field">
            <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search stocks..." className="search-input" />
            {loading && <Loader2 className="search-loader" />}
          </div>
          <CommandList className="search-list">
            {loading ? (
                <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
            ) : displayStocks?.length === 0 ? (
                <div className="search-list-indicator">
                  {isSearchMode ? 'No results found' : 'No stocks available'}
                </div>
              ) : (
              <ul>
                <div className="search-count">
                  {isSearchMode ? 'Search results' : 'Popular stocks'}
                  {` `}({displayStocks?.length || 0})
                </div>
                {displayStocks?.map((stock, i) => (
                    <li key={stock.symbol} className="search-item">
                      <Link
                          href={`/stocks/${stock.symbol}`}
                          onClick={handleSelectStock}
                          className="search-item-link"
                      >
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                        <div  className="flex-1">
                          <div className="search-item-name">
                            {stock.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {stock.symbol} | {stock.exchange } | {stock.type}
                          </div>
                        </div>
                      {/*<Star />*/}
                      </Link>
                    </li>
                ))}
              </ul>
            )
            }
          </CommandList>
        </CommandDialog>
      )}
    </>
  )
}