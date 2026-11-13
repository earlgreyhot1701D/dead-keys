# AWS teardown: Dead Keys AI drills

PRD G15, ai-drills Req 6.8. Everything Block 10 created for the AI drill route, and how to remove it after judging closes (**Jan 29, 2027**) or at the v2 decision (about Feb 3, 2027). There is no IAM user and no access key: the route uses Vercel OIDC federation, so there is no key to delete.

Account `<ACCOUNT_ID>` (the real ID is in the AWS console and Shara's notes, not in this public repo), set up Nov 13, 2026 through the `default` AWS CLI profile.

## What exists

| Resource | Name or ARN | Notes |
|---|---|---|
| IAM role | `arn:aws:iam::<ACCOUNT_ID>:role/dead-keys-drill` | Trusted only by the Vercel OIDC provider below, only for `owner:earlgreyhot1701ds-projects:project:dead-keys:environment:preview` and `...:environment:production`. Tag `project=dead-keys` |
| Inline policy on the role | `dead-keys-nova-micro-invoke` | `bedrock:InvokeModel` only: the us-east-1 inference profile `us.amazon.nova-micro-v1:0`, and the Nova Micro foundation models in us-east-1, us-east-2 and us-west-2 only through that profile |
| IAM OIDC identity provider | `arn:aws:iam::<ACCOUNT_ID>:oidc-provider/oidc.vercel.com/earlgreyhot1701ds-projects` | Audience `https://vercel.com/earlgreyhot1701ds-projects`. Created for Dead Keys; it is shared only if another Vercel project in this team also uses it (check before deleting). Tag `project=dead-keys` |
| AWS Budgets budget | `dead-keys` | $5 a month, **Amazon Bedrock only** (cost filter `Service = Amazon Bedrock`). Emails the account owner on actual spend over 100% and on forecast over 100% |
| Log groups | none in AWS | The usage ledger goes to the Vercel function log (Vercel keeps it on its own schedule). Bedrock model invocation logging is off, so Bedrock writes no log group. Checked Nov 13 with `aws logs describe-log-groups` |
| Vercel env vars (project `dead-keys`, Preview and Production) | `AWS_ROLE_ARN`, `AWS_REGION` | Not secrets: the role ARN and `us-east-1` |

## Teardown steps (after Jan 29, 2027, or at the v2 decision)

Run with the `default` profile. Each step only removes what Dead Keys created.

1. Turn the route off first, so nothing calls Bedrock while you work: remove the two Vercel env vars, then redeploy production.
   ```
   npx vercel env rm AWS_ROLE_ARN production
   npx vercel env rm AWS_ROLE_ARN preview
   npx vercel env rm AWS_REGION production
   npx vercel env rm AWS_REGION preview
   ```
   Without `AWS_ROLE_ARN` the route's Bedrock call fails, and players get the built-in drill, labeled built-in.
2. Delete the role's inline policy, then the role:
   ```
   aws iam delete-role-policy --role-name dead-keys-drill --policy-name dead-keys-nova-micro-invoke
   aws iam delete-role --role-name dead-keys-drill
   ```
3. Check no other role trusts the OIDC provider, then delete it:
   ```
   aws iam list-roles --query "Roles[?contains(to_string(AssumeRolePolicyDocument), 'oidc.vercel.com/earlgreyhot1701ds-projects')].RoleName"
   aws iam delete-open-id-connect-provider --open-id-connect-provider-arn arn:aws:iam::<ACCOUNT_ID>:oidc-provider/oidc.vercel.com/earlgreyhot1701ds-projects
   ```
   If the list is not empty, another project uses the provider: keep it.
4. Keep or delete the budget (it costs nothing; keeping it a month catches a late bill):
   ```
   aws budgets delete-budget --account-id <ACCOUNT_ID> --budget-name dead-keys
   ```
5. Optional: turn off OIDC federation in the Vercel project's settings (Settings, Security) if nothing else needs it.
6. Record the date of each step in `KIRO-NOTES.md`.

## Teardown record

| Step | Date | By |
|---|---|---|
| 1. Vercel env vars removed | | |
| 2. Role and inline policy deleted | | |
| 3. OIDC provider deleted (or kept, and why) | | |
| 4. Budget deleted (or kept) | | |
