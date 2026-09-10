import NoPermissionNotice from "@/components/NoPermissionNotice";
import RecipeForm from "@/components/RecipeForm";
import { requireUser } from "@/lib/guard";
import { can } from "@/lib/permissions";

export const metadata = { title: "Add a recipe" };

export default async function NewRecipePage() {
  const user = await requireUser("/recipes/new");
  if (!can(user, "recipes:create")) {
    return <NoPermissionNotice needs="recipes:create" />;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">Add a recipe</h1>
      <RecipeForm />
    </div>
  );
}
