import random
import math
class RPSGame():
    def __init__(self, iconList):
        self.iconList = iconList
        # self.iconList = random.shuffle(iconList) # randomise so there is no favouritism
        self.remaining = [0, 0, 0]
        self.moveSpeed = 1
        self.calculateSetups()

    def calculateSetups(self):
        print("=============================")
        for icon in self.iconList:
            print(icon, icon[2])
            if icon[2] == "rock.jpg":
                self.remaining[0] += 1
            elif icon[2] == "paper.jpg":
                self.remaining[1] += 1
            elif icon[2] == "scissors.jpg":
                self.remaining[2] += 1
        print(self.remaining)

    def findTarget(self, icon):
        if icon == "rock.jpg":
            target = "scissors.jpg"
        elif icon == "paper.jpg":
            target = "rock.jpg"
        elif icon == "scissors.jpg":
            target = "paper.jpg"
        else:
            return None
        
        # find a random target of the correct type
        for i in range(len(self.iconList)):
            if self.iconList[i][2] == target:
                return self.iconList[i][4]

        return None

    def colliding(self, icon1, icon2):
        size = 25
        return (math.fabs(icon1[0] - icon2[0]) < size and math.fabs(icon1[1] - icon2[1]) < size)

    def findAndRemove(self, target):
        for i in range(len(self.iconList)):
            if self.iconList[i][4] == target:
                self.iconList.pop(i)
                return

    def lookupIcon(self, identifier):
        for icon in self.iconList:
            if icon[4] == identifier:
                return icon
        return None

    def tick(self):
        # end condition
        if sum([self.remaining[i] > 0 for i in range(3)]) <= 1:
            print(self.remaining)
            return "end"
    

        pendingRemoval = []
        # else we need to tick everything over
        # update all the icons
        for i in range(len(self.iconList)):
            if self.iconList[i][4] in pendingRemoval:
                continue # skip the dead guys
            # if there is no target, find a target
            # if we have a target, check if the target is still valid, if not find a new target
            # if we have a valid target, check if we can eat it, if so eat it
            if self.iconList[i][3] == None:
                self.iconList[i][3] = self.findTarget(self.iconList[i][2])
            else: # we have a target, check if the target is still valid
                target = self.lookupIcon(self.iconList[i][3])
                if target not in self.iconList: # target has been eaten, find a new target
                    self.iconList[i][3] = self.findTarget(self.iconList[i][2])
                else: # we have a valid target, check if we can eat it
                    if self.colliding(self.iconList[i], self.lookupIcon(self.iconList[i][3])):
                        # eat the target
                        # self.findAndRemove(self.iconList[i][3])
                        pendingRemoval.append(self.iconList[i][3])
                        # print("Eating " + self.iconList[i][2] + " as " + self.lookupIcon(self.iconList[i][3])[2])
                        # update the remaining counts
                        if self.lookupIcon(self.iconList[i][3])[2] == "rock.jpg":
                            self.remaining[0] -= 1
                        elif self.lookupIcon(self.iconList[i][3])[2] == "paper.jpg":
                            self.remaining[1] -= 1
                        elif self.lookupIcon(self.iconList[i][3])[2] == "scissors.jpg":
                            self.remaining[2] -= 1
                    else: # we aren't colliding, just move
                        # move towards the target
                        if (target[0] - self.iconList[i][0]) > 0:
                            self.iconList[i][0] += self.moveSpeed
                        elif (target[0] - self.iconList[i][0]) < 0:
                            self.iconList[i][0] -= self.moveSpeed

                        if (target[1] - self.iconList[i][1]) > 0:
                            self.iconList[i][1] += self.moveSpeed
                        elif (target[1] - self.iconList[i][1]) < 0:
                            self.iconList[i][1] -= self.moveSpeed
                            


                        # self.iconList[i][0] += 1 if (target[0] - self.iconList[i][0]) > 0 else -1
                        # self.iconList[i][1] += 1 if (target[1] - self.iconList[i][1]) > 0 else -1

        for icon in pendingRemoval:
            self.findAndRemove(icon)


        return "Still going " + self.remaining.__str__()