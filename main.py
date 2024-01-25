import asyncio
import uvicorn
import time
import threading
from fastapi import FastAPI, APIRouter
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

app = FastAPI()
router = APIRouter()

coinhall_data = {
    "trending": [],
    "pools": [],
    "init": True
}

def startParsing():
    path_to_chromedriver = './chromedriver.exe' 
    chrome_options = Options()

    chrome_options.add_argument('--ignore-certificate-errors')
    chrome_options.add_argument('--allow-running-insecure-content')

    service = Service(executable_path=path_to_chromedriver)
    driver = webdriver.Chrome(service=service, options=chrome_options)

    url = 'https://coinhall.org/?tab=pools&watchlist=false&timeframe=1h&sort=new&dir=desc&verified=false&reliable=false&chains=injective%2Csei%2Cosmosis%2Cnear%2Cjuno%2Ckujira%2Cmigaloo%2Carchway%2Cterraclassic%2Cneutron%2Cterra'
    driver.get(url)

    while True:
        tokens_elements = driver.find_elements(By.XPATH, '/html/body/div[1]/main/div/div[2]/div/table/tbody/tr')
        trends_elements = driver.find_elements(By.XPATH, '/html/body/div[1]/div/div[1]/a')
        
        while len(tokens_elements) == 0 or len(trends_elements) == 0:
            tokens_elements = driver.find_elements(By.XPATH, '/html/body/div[1]/main/div/div[2]/div/table/tbody/tr')
            trends_elements = driver.find_elements(By.XPATH, '/html/body/div[1]/div/div[1]/a')
    
            time.sleep(5)

        
        trending = []
        for token in trends_elements:
            try:
                url = token.get_attribute('href')
                position = token.find_element(By.XPATH, './span[1]').text
                assetToken = token.find_element(By.XPATH, './span[2]').text
                baseToken = token.find_element(By.XPATH, './span[4]').text

                
                trending.append({
                    "url": url,
                    "position": int(position.replace('#', '')),
                    "assetToken": assetToken,
                    "baseToken": baseToken
                })
            except:
                pass
        
        coinhall_data['trending'] = trending
        
        for token in tokens_elements:
            try:
                url = token.find_element(By.XPATH, './td[1]/a').get_attribute('href')
                assetToken = token.find_element(By.XPATH, './td[1]/a/div/div[2]/div[1]/span[1]').text
                baseToken = token.find_element(By.XPATH, './td[1]/a/div/div[2]/div[1]/span[3]').text

                if url and assetToken and baseToken:
                    new_pool = len([pool for pool in coinhall_data['pools'] if pool['url'] == url ]) == 0
                    
                    if new_pool:
                        coinhall_data['pools'].append({
                            "url": url,
                            "assetToken": assetToken,
                            "baseToken": baseToken
                        })
            except:
                pass
        
        
        coinhall_data['init'] = False
        time.sleep(10)
        driver.refresh()

def startServer():
    @router.get("/",)
    async def read_data():
        return coinhall_data

    app.include_router(router)
    
    uvicorn.run(app, host="0.0.0.0", port=36464)
    
    
def main():
    serverThread = threading.Thread(target=startServer)
    parsingThread = threading.Thread(target=startParsing)
    
    serverThread.start()
    parsingThread.start()

if __name__ == '__main__':
    main()