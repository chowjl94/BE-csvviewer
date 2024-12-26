# Set up instructions
- Create a s3 bucket generate the following below
- Add to .env (AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,S3_REGION,AWS_BUCKET)
- follow env.example

# Development
- npm install 
- npm run dev

# Non -development
- npm install 
- npm run build
- npm run start

# Extra information
- USER uploads file to s3 and gets storred in s3
- Clinet will get the stored url and sign it
- Signed url will then be loaded as csv and rendered on client
- Did not deploy it on CSP 

# Consideration
- Vite + React is fast and flexible for small projects
- S3 is used as it is scalable and secure (although setting up requires an account)
