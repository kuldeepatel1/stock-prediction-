import yfinance as yf
syms = ['CADILAHC.NS','500048.BO','500048.NS','CADILAHC.BO','CADILAHC']
for sym in syms:
    try:
        df = yf.download(sym, period='1mo', interval='1d', progress=False)
        print(sym, 'rows', len(df))
    except Exception as e:
        print(sym, 'ERROR', e)
