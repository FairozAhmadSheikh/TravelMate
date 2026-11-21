from tavily import TavilyClient
from tools.settings import settings

client=TavilyClient(api_key=settings.TAVILY_API_KEY)

def tavily_search(query):
    response=client.search(query=query,max_results=3)
    results=[]
    for index,data in enumerate(response['results'],start=1):
        title=data.get('title',"")
        url=data.get('url',"")
        snippet=data.get('content',"")
        if len(snippet)>300:
            snippet=snippet[:300].rsplit(" ",1)[0]+"...."

        results.append(f'{index} **{title}**\n {url} \n {snippet}')
    return "\n\n".join(results)