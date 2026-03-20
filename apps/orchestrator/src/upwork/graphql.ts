type GqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function upworkGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  accessToken: string,
  tenantId: string
): Promise<T> {
  const res = await fetch("https://api.upwork.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Upwork-API-TenantId": tenantId
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await res.json() as GqlResponse<T>;
  if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join(" | "));
  if (!json.data) throw new Error("No data");
  return json.data;
}
