import { createResponse } from "../helpers/response.helper";
import { supabase } from "../lib/supabaseClient";
import { SupabaseError } from "../vars";

type getModelConfigOptions = {
	onlyOwnedByUser: string
}

export const db = {
	getModelConfig: async (modelName: string, channel_id: string, options?: getModelConfigOptions) => {
		const [provider, ...modelIdParts] = modelName.split("/");
		const modelId = modelIdParts.join("/")

		// check channel availability
		const {data: channel, error: channelError} = await supabase.from("channels").select("*").eq("id", channel_id).eq("is_archived", false).single();
		if (channelError) {
			if (channelError.code == SupabaseError.NotFoundOrMultipleRows) {
				return createResponse("Channel not found", 404);
			}
			return createResponse(channelError.message, 500);
		}

		// check if channel is owned by user or public channel in the workspace
		if (channel.is_private){
			const {data: channel, error: channelError} = await supabase.from("channels").select("created_by").eq("id", channel_id).single();
			if (channelError) {
				return createResponse(channelError.message, 500);
			}

			if (channel.created_by !== options?.onlyOwnedByUser) {
				return createResponse("Channel not found", 404);
			}
		}

		// public channel will viewable by member in the workspace
		const {data: isMemberOfWorkspace, error: workspaceMembersError} = await supabase.from("workspace_members").select("*").eq("workspace_id", channel.workspace_id).eq("user_id", options?.onlyOwnedByUser).single();
		if (workspaceMembersError) {
			return createResponse(workspaceMembersError.message, 500);
		}

		if (!channel || !isMemberOfWorkspace) {
			return createResponse("Channel not found", 404);
		}

		const model = await supabase.from("models").select("id, name, category_id").eq("name", modelId).single().then(({data}) => data);
		const category = await supabase.from("category").select("name").eq("id", model?.category_id).single().then(({data}) => data);
		const key = await supabase.from("api_keys").select("id, api_key").eq("model_id", model?.id).single().then(({data}) => data);
		const tool = await supabase.from("channel_tools").select("id").eq("api_key_id", key?.id).eq("workspace_id", channel.workspace_id).single().then(({data}) => data);

		if (!model || !key || !category || !tool) {
			console.log("getModelConfig", model, key, tool, channel.workspace_id);
			return {
				data: null
			}
		}

		const modelConfig = {
			data: {
				id: tool.id,
				workspace_id: channel.workspace_id,
				api_key: key.api_key,
				systemPrompt: await supabase.from("system_prompts").select("prompt").eq("workspace_id", channel.workspace_id).then(({data}) => data?.map(x => x.prompt).join("\n")),
				model: model.name,
				category: category.name
			}
		}

		return modelConfig;
	},
};

