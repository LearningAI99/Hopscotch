# Hopscotch

**Should you hop cities for a cheaper fare?**

Every flight search tool will happily show you that a flight from Vancouver is $300 cheaper than the same flight from Seattle. None of them will tell you what it actually costs to get to Vancouver — the one-way rental, the drop-off fee, the cross-border charge, the border wait, your time. Hopscotch calculates the net and gives you a straight verdict: **Worth it**, **Borderline**, or **Not worth it**.

Built for the US/Canada border corridors where fare arbitrage is real but the hidden costs regularly eat the saving — and sometimes strand people at the border with a rental car that isn't allowed to cross.

## Try it

Open `index.html` in a browser. That's it — no build step, no dependencies, no framework. One file. (Want to run your own copy with feedback and affiliate links wired up? See [SETUP.md](SETUP.md).)

## What it does

All amounts below are in **USD** unless marked otherwise. The calculator works in USD and CAD and shows results in both.

- **Net cost calculation** — fare saving minus the cost of getting there, cross-border fees, positioning flight, and optionally your time: you set what an hour of your time is worth (say $25/hr), and the travel hours are costed at that rate. Leave it blank and time is ignored entirely
- **Your own car, not just rentals** — the way most people actually do this hop. Costs fuel and running at US$0.22/km round trip, plus airport parking for every day you're away, and skips the rental-company cross-border restrictions (though not the insurance question)
- **Trip length drives the maths** — a car left at the airport for ten days is usually the biggest cost of the whole trip, and for a return rental the tool prices both keeping one car for the duration *and* taking two separate one-ways, then uses whichever is cheaper and tells you why
- **Transport modes matched to the corridor** — rental car (priced per vehicle) plus bus and train (priced per person) wherever scheduled service is verified to exist. Seattle–Vancouver offers bus (US$21–45) and Amtrak Cascades (US$50–100); Detroit–Windsor has the Linq Tunnel Bus (~US$17.50); Minneapolis–Winnipeg is honestly flagged as rental-only since Greyhound Canada's shutdown. One special case: at the Niagara Falls twin cities, a **walk** option appears — you can cross the Rainbow Bridge on foot for about a dollar
- **Every option ranked side by side** — one calculation shows what own car, rental, bus, train (and walking, at Niagara) each net out at, with the best value flagged. The answer genuinely flips: on a 10-day Seattle–Vancouver hop the bus wins for a solo traveller, but own car wins for a family of four
- **Timing, honestly** — a door-to-gate estimate combining travel time, typical border wait and check-in, presented as a floor rather than a false-precision departure time
- **Travellers count** — transit tickets are per person, rentals per vehicle, so the same trip can flip verdicts between a solo traveller and a family of four
- **9 verified border corridors** — Seattle–Vancouver, Bellingham–Vancouver, Blaine–Vancouver, Buffalo–Toronto, Detroit–Windsor, Minneapolis–Winnipeg, Niagara Falls (twin cities), Sault Ste. Marie (twin cities), Huntingdon–Sumas. Unknown city pairs still work with clearly flagged estimates
- **Cross-border rental warnings** — the risks fare and booking tools don't surface: which restrictions apply, that insurance changes at the border, that you must carry the rental agreement, tunnel restrictions at Detroit–Windsor, the US$100 drop fee at Niagara
- **Seasonal intelligence** — summer border wait warnings, winter driving flags on the prairie corridor, tourist-season congestion notes
- **Route intelligence** — which airport actually has the routes (YVR's trans-Pacific network vs SEA's domestic strength, and so on)
- **Multi-currency** — enter each fare in the currency you see on the booking site; defaults set per city; conversion shown live
- **Shareable results** — every calculation encodes into a URL anyone can open

## How the verdict works

No black box — the maths is simple and deliberately visible in the full breakdown on every result:

```
net = (fare saving × travellers)
      − cost of getting there
          own car:  fuel & running (round trip) + parking × days
          rental:   one-way → 1 day + drop-off fee + cross-border fee
                    return  → cheaper of (daily × days+1 + parking × days)
                              and (two one-way rentals)
          transit:  ticket × travellers × legs
      − positioning flight (if any)
      − travel hours × your time value (if set)
```

Everything is converted to your base currency (the currency of your starting-city fare) before comparing. The verdict thresholds: net above **+US$50** → *Worth it* · between **+US$50 and −US$30** → *Borderline* · below **−US$30** → *Not worth it*. Borderline exists because our rental and transit figures are typical rates, not live quotes — inside that band, a worse quote or a longer border wait can flip the answer, and the calculator says so.

## Data honesty

Rental, bus, train and airport parking figures are typical rates per corridor, last reviewed **July 2026** (parking is the on-site economy rate and is editable in the form) — the calculator says so on every result and pushes users toward a real quote before deciding. Corridors we researched but **deliberately excluded** for lack of rental infrastructure: Pembina–Emerson, Coutts–Sweet Grass, St. Stephen–Calais, Stanstead–Derby Line, Fort Erie as a standalone, and Point Roberts (which needs its own special-case logic).

Found a wrong number or a policy that changed? [Open an issue](../../issues). Corridor data lives in the `KNOWN` object in `index.html` — corrections and new verified corridors are welcome as PRs. A new corridor needs: distance, drive time, typical one-way and return rental cost, drop-off fee, cross-border fee, verified transit options if any, and confirmation that rental companies actually operate on both sides.

## Roadmap (deliberately not built yet)

- Schengen corridors (Amsterdam–Eindhoven, Vienna–Bratislava, Milan Malpensa–Bergamo, …)
- Live rental quotes via the Booking.com Demand API
- Inbound and both-leg repositioning
- Travel-date input driving seasonal warnings dynamically

## Disclaimer

This tool is for general information only. It is not legal or financial advice. Rental prices, bus and train fares, cross-border policies, fees and wait times vary by company, location and season, and change over time. Always verify directly with the provider before booking.

## License

MIT — see [LICENSE](LICENSE). In short: this project is open source; anyone may use, modify and redistribute the code, provided the copyright notice stays intact, and it comes with no warranty.
