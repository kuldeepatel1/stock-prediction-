import yfinance as yf
import sys

def main():
    try:
        df = yf.download('CADILAHC.NS', period='5y', interval='1d', progress=False)
        print('rows:', len(df))
        if df.empty:
            print('EMPTY')
        else:
            print(df.tail(3).to_string())
    except Exception as e:
        print('ERROR', e)
        sys.exit(1)

if __name__ == '__main__':
    main()
