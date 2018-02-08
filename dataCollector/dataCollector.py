import json
import requests

START_DATE = '2018-01-02'
END_DATE = '2018-02-01'

BASE_URL = 'https://api.moves-app.com/api/1.1'
ACTIVITY_URL = BASE_URL + '/user/summary/daily?from=' + START_DATE + '&to=' + END_DATE

#Anything in here will be averaged out over everyone that uses it. Please only put transports in here, otherwise bad stuff will happen :-)
greenTransports = ['bus']

#Global scaling factor for distances
scale = 10 ** -3

#Load user tokens
data = json.load(open('../userKeys.json'))

finalDict = {}
busNums = {}
busDist = {}

for user in data:
    #Make request
    r = requests.get(ACTIVITY_URL, headers = {'Authorization': 'Bearer ' + user['access_token']})
    returnData = r.json()

    if (isinstance(returnData, dict) and returnData['error']):
        raise Exception(returnData['error'])

    for day in returnData:
        if day['summary']:
            for activity in day['summary']:
                #Check if it belongs in a group
                if 'group' in activity.keys():
                    #OK. Register it for the appropiete class
                    clss = user['class']
                    if (not clss in finalDict.keys()):
                        finalDict[clss] = {
                            'walking': 0,
                            'running': 0,
                            'cycling': 0,
                            'transport': 0,
                        }

                    #Bus check!
                    if (activity['activity'] in greenTransports):
                        if (not clss in busNums.keys()):
                            busNums[clss] = 0
                        if (not clss in busDist.keys()):
                            busDist[clss] = 0
                        
                        
                        busNums[clss] += 1
                        busDist[clss] += activity['distance'] * scale
                    else:
                        finalDict[clss][activity['group']] += activity['distance'] * scale

#final step in bus check
for i in busDist.keys():
    finalDict[i]['transport'] += busDist[i] / busNums[i]

#Turn into csv
with open ('data.json','w') as f:
    f.write(json.dumps(finalDict, indent=4))