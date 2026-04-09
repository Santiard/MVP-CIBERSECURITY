import React, { useEffect, useMemo, useState } from 'react';

type Country = {
  code: string;
  name: string;
  dialCode: string;
  example: string;
  digits: number;
  flag: string;
};

const COUNTRIES: Country[] = [
  { code: 'CO', name: 'Colombia', dialCode: '+57', example: '300-000-0000', digits: 10, flag: '🇨🇴' },
  { code: 'MX', name: 'México', dialCode: '+52', example: '55-0000-0000', digits: 10, flag: '🇲🇽' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', example: '555-000-0000', digits: 10, flag: '🇺🇸' },
  { code: 'ES', name: 'España', dialCode: '+34', example: '600-000-000', digits: 9, flag: '🇪🇸' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', example: '11-0000-0000', digits: 10, flag: '🇦🇷' },
  { code: 'PE', name: 'Perú', dialCode: '+51', example: '9-000-000-000', digits: 9, flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', dialCode: '+56', example: '9-0000-0000', digits: 9, flag: '🇨🇱' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', example: '11-0000-0000', digits: 11, flag: '🇧🇷' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', example: '412-000-0000', digits: 10, flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', example: '9-000-000-000', digits: 9, flag: '🇪🇨' },
  { code: 'PA', name: 'Panamá', dialCode: '+507', example: '6000-0000', digits: 8, flag: '🇵🇦' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', example: '6000-0000', digits: 8, flag: '🇨🇷' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', example: '4000-0000', digits: 8, flag: '🇬🇹' },
];

const countryByDialCode = (value: string, countries: Country[]) => {
  const normalized = value.replace(/[^\d+]/g, '');
  const ordered = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const country of ordered) {
    if (normalized.startsWith(country.dialCode.replace('+', '')) || normalized.startsWith(country.dialCode)) {
      return country;
    }
  }
  return countries[0];
};

const cleanDigits = (value: string) => value.replace(/\D/g, '');

const formatLocalExample = (example: string) => example.replace(/[0-9]/g, '*');

const formatDigits = (digits: string, example: string) => {
  let result = '';
  let digitIndex = 0;
  for (let i = 0; i < example.length && digitIndex < digits.length; i++) {
    if (/\d/.test(example[i])) {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += example[i];
    }
  }
  return result;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  countries?: Country[];
  maxDropdownHeight?: number;
};

const PhoneField: React.FC<Props> = ({ value, onChange, error, countries = COUNTRIES, maxDropdownHeight = 220 }) => {
  const [country, setCountry] = useState<Country | null>(() => {
    if (!value) return null;
    return countryByDialCode(value, countries);
  });

  const [localDigits, setLocalDigits] = useState(() => {
    if (!value) return '';
    const selected = countryByDialCode(value, countries);
    const digits = cleanDigits(value);
    return digits.startsWith(selected.dialCode.replace('+', '')) ? digits.slice(selected.dialCode.length) : digits;
  });

  const [displayLocalDigits, setDisplayLocalDigits] = useState(() => {
    if (!value) return '';
    const selected = countryByDialCode(value, countries);
    const digits = cleanDigits(value);
    const cleanLocal = digits.startsWith(selected.dialCode.replace('+', '')) ? digits.slice(selected.dialCode.length) : digits;
    return formatDigits(cleanLocal, selected.example);
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const prevValue = React.useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;

    if (!value) {
      setCountry(null);
      setLocalDigits('');
      return;
    }

    const selected = countryByDialCode(value, countries);
    const digits = cleanDigits(value);
    setCountry(selected);
    setLocalDigits(digits.startsWith(selected.dialCode.replace('+', '')) ? digits.slice(selected.dialCode.length) : digits);
    setDisplayLocalDigits(formatDigits(digits.startsWith(selected.dialCode.replace('+', '')) ? digits.slice(selected.dialCode.length) : digits, selected.example));
  }, [value]);

  const updatePhone = (nextCountry: Country, nextDigits: string) => {
    const normalizedDigits = nextDigits.slice(0, nextCountry.digits);
    setCountry(nextCountry);
    setLocalDigits(normalizedDigits);
    setDisplayLocalDigits(formatDigits(normalizedDigits, nextCountry.example));
    const nextValue = `${nextCountry.dialCode}${normalizedDigits ? ` ${normalizedDigits}` : ''}`;
    prevValue.current = nextValue;
    onChange(nextValue);
  };

  const handleCountrySelect = (item: Country) => {
    updatePhone(item, '');
    setDropdownOpen(false);
  };

  const handleLocalChange = (raw: string) => {
    if (!country) return;
    const digits = cleanDigits(raw).slice(0, country.digits);
    updatePhone(country, digits);
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ position: 'relative' }}>
        <label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>Selecciona país</label>
        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: 12,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <span>{country ? `${country.flag} ${country.name} (${country.dialCode})` : 'Seleccione un país'}</span>
          <span style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}>▼</span>
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 8,
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'var(--surface-light)',
            maxHeight: maxDropdownHeight,
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            zIndex: 10,
          }}>
            {countries.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleCountrySelect(item)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  background: country?.code === item.code ? 'rgba(25,118,210,0.08)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>{item.flag}</span>
                  <span>{item.name}</span>
                </span>
                <span style={{ color: 'var(--muted)' }}>{item.dialCode}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'var(--muted)' }}>Número telefónico</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ minWidth: 90, padding: 10, borderRadius: 8, background: 'var(--bg-light)', border: '1px solid var(--border)', textAlign: 'center' }}>
            {country ? country.dialCode : '---'}
          </div>
          <input
            type="tel"
            value={displayLocalDigits}
            onChange={(event) => handleLocalChange(event.target.value)}
            placeholder={country ? formatLocalExample(country.example) : 'Selecciona un país primero'}
            inputMode="numeric"
            disabled={!country}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: error ? '1px solid var(--danger)' : '1px solid var(--border)',
              background: country ? 'var(--white)' : 'var(--bg-light)',
              color: country ? 'inherit' : 'var(--muted)'
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {country ? `Ejemplo: ${country.dialCode} ${formatLocalExample(country.example)}` : 'Selecciona un país para ver el formato de número'}
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{error}</div>}
      </div>
    </div>
  );
};

export default PhoneField;
