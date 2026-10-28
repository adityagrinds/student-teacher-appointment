import { Search } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder = 'Search...', label = 'Search' }) {
  return (
    <label className="search-input">
      <span className="sr-only">{label}</span>
      <Search size={16} aria-hidden="true" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  )
}
