import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://rtk-chat-backend.onrender.com/api/v1/",
    prepareHeaders: (headers, { getState }) => {
      const state = getState?.();
      const token = state?.auth?.token || localStorage.getItem("token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: ["chat"],
  endpoints: (builder) => ({
    createChat: builder.mutation({
      query: (data) => ({
        url: "chats",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["chat"],
    }),

    getChats: builder.query({
      query: () => ({
        url: "chats",
      }),
      providesTags: ["chat"],
    }),

    getChatMessages: builder.query({
      query: (chatId) => ({
        url: `chats/${chatId}/messages`,
      }),
    }),

    getInvites: builder.query({
      query: () => ({
        url: "invites",
      }),
      providesTags: ["chat"],
    }),

    // 🔥 FIXED (old: acceptInvites)
    acceptInvite: builder.mutation({
      query: (inviteId) => ({
        url: `invites/${inviteId}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["chat"],
    }),

    joinChat: builder.mutation({
      query: (chatId) => ({
        url: `chats/${chatId}/join`,
        method: "POST",
      }),
      invalidatesTags: ["chat"],
    }),

    inviteToChat: builder.mutation({
      query: ({ chatId, payload }) => ({
        url: `chats/${chatId}/invite`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["chat"],
    }),

    deleteChat: builder.mutation({
      query: (chatId) => ({
        url: `chats/${chatId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["chat"],
    }),

    editMessage: builder.mutation({
      query: ({ chatId, messageId, text }) => ({
        url: `chats/${chatId}/messages/${messageId}`,
        method: "PATCH",
        body: { text },
      }),
    }),

    deleteMessage: builder.mutation({
      query: ({ chatId, messageId }) => ({
        url: `chats/${chatId}/messages/${messageId}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateChatMutation,
  useGetChatsQuery,
  useGetChatMessagesQuery,
  useJoinChatMutation,
  useInviteToChatMutation,
  useDeleteChatMutation,
  useGetInvitesQuery,
  useAcceptInviteMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
} = chatApi;
