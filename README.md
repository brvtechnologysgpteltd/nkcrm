This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# Notes
1. Done -> Add metrics WALK-IN against MEMBER SALES
2. Add metrics by sales location performance, by month 
3. Top product by location
4. Segment customers by location who needs more attention who less visit the branch or outlet  (segment customers by frequency of going to salon)
5. Under sales by location card, show which product or service on how much is the equivalent for the total sales by location
6. Try to add also the peak period in every branch report

# Customer Segment by Location 2025
Try to segment my customer base on location who have visited at least once in the past 6 months after they signed up for the year 2025, Where signup field is from tblmembers.dtMember_JoinedDate

# Birthday month february 2026
show me birthday month for february and are active and last sale more than 6 months ago
show me birthday month for february and are active and last sale less than 2 months ago


# SSH 
ssh nk@nkftp.dyndns.org -i /users/mike/downloads/nk.pem
sudo su
Nk67481095Ns


git pull && docker compose down && docker rmi -f $(docker images | grep nkcrm-crm | awk '{print $3}')  && docker compose up -d --force-recreate

