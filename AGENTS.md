<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- SharePoint filing: PDFs built with pdf-lib in src/lib/sharepoint.server.ts, uploaded via connector gateway to Patients/Patient Information/<patient>/(Nursing Visit Notes|Patient Notes)/<year>/ — matches the agency's existing folder layout.
- Phone authentication uses shared, tested normalization and mode-specific OTP options; sign-in never creates accounts or requires a name, while signup includes the name.
