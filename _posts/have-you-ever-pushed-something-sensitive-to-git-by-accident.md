{{{
  "title": "Have You Ever Pushed Something Sensitive to Git by Accident?",
  "tags": ["github"],
  "category": "development",
  "date": "2013/08/26"
}}}

I did just that yesterday. In a hurry to get some content live for my website I accidentally pushed a config file to GitHub containing my Twitter, Tumblr and Moves API keys. 

My first instinct was to immediately head over to GitHub and delete the file... which of course is simple since file deletion goes against everything a VCS like Git tries to achieve. Deleting the file would only remove it from that version while previous commits and history will still show the sensitive content.

The answer lies in this GitHub help post [https://help.github.com/articles/remove-sensitive-data](https://help.github.com/articles/remove-sensitive-data). However, the post missed a few points which had me chasing myself in circles as kept re-committing my config file from my working folder in a recursive nightmare. Hopefully what I learned and captured here will save you or someone else some valuable time.
<!--more-->
#Scenario
You have a local repo in a standardized directory structure. A file has been inadvertently pushed upstream to origin and you need to remove it and all mentions of it in history. When everything is cleaned up you want to continue to work in the same standardized directory structure. 

We use /C/git/[client]/[brand]/[project] as our format so let's set /C/git/Big-Corp/Wonder-Pop/Website as our working repo directory and use /config/config.json as our offending file.

In the following steps we will:

1. Clone a new copy of the repo
2. Iterate the history of the master branch pruning all mentions of the file
3. Push the changes back to origin
4. Delete our current working directory
5. Clone a new copy, sans offending histories and file, into a directory of our original name 

#Steps 
The first step is to commit anything that is outstanding in our project and push to origin. Then clone a completely fresh version from origin. 

    mkdir /C/temp
    git clone git@github.com:wonder-pop-website.git /C/temp/tmp-clone
    cd /C/temp/tmp-clone

Now we iterate the entire history looking for and pruning the config.json file from every commit. Any commits that become empty as a result will be removed altogether. 

    git filter-branch --force --index-filter "git rm --cached --ignore-unmatch config/config.json" --prune-empty --tag-name-filter cat -- --all

Next we check history to confirm that what we ran above was effective. This is destructive so if we accidentally removed the wrong file (or maybe an entire directory) we could be in real trouble. Assuming everything looks good we update our origin.
 
    git push origin master --force

At this point the cloned repo in /C/temp is in great shape but the repo in our working directory still contains all the offending file. If we switch back to that we risk pushing the config.json back into Git on our next commit. One option is dereference the objects and force garbage collection as the GitHub help post specified. 

##Option 1
The post did not indicate that it was necessary to switch back to the working directory -- and which I missed until much later due to my frantic panic. I kept applying these steps to my temporary clone then when I switched back to my working folder, committed a change, the file would reappear.

    cd /C/git/Big-Corp/Wonder-Pop/Website
    rm -rf .git/refs/original/
    git reflog expire --expire=now --all
    git gc --aggressive --prune=now

##Option 2
This is my preferred approach. 

    cd /C/git/Big-Corp/Wonder-Pop
    rm -r -f Website
    git clone git@github.com:wonder-pop-website.git Website

1. Check the new local repo to confirm config.json does not exist nor do any history entries referencing a cached copy.
2. Check the origin and confirm config.json does not exist nor do any history entries referencing a cached copy.
3. Commit and push a change to origin and repeat steps 1 and 2 to make sure the commit didn't pick up anything else.



 


