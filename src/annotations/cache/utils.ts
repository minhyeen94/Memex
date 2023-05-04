import type {
    FollowedList,
    FollowedListEntry,
    RemotePageActivityIndicatorInterface,
} from 'src/page-activity-indicator/background/types'
import type {
    PageList,
    RemoteCollectionsInterface,
} from 'src/custom-lists/background/types'
import type { Annotation, SharedAnnotationWithRefs } from '../types'
import type {
    PageAnnotationsCacheInterface,
    UnifiedAnnotation,
    UnifiedAnnotationForCache,
    UnifiedList,
    UnifiedListForCache,
} from './types'
import { shareOptsToPrivacyLvl } from '../utils'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { AnnotationInterface } from '../background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

export const reshapeAnnotationForCache = (
    annot: Annotation & {
        createdWhen?: Date | number
        lastEdited?: Date | number
    },
    opts: {
        extraData?: Partial<UnifiedAnnotation>
        /** Generally only used for test assertions - local list IDs will be mapped to cache IDs internally */
        excludeLocalLists?: boolean
    },
): UnifiedAnnotationForCache => {
    if (annot.createdWhen == null) {
        throw new Error(
            'Cannot reshape annotation missing createdWhen timestamp',
        )
    }
    const createdWhen =
        typeof annot.createdWhen === 'number'
            ? annot.createdWhen
            : annot.createdWhen.getTime()
    const lastEdited =
        annot.lastEdited == null
            ? createdWhen
            : typeof annot.lastEdited === 'number'
            ? annot.lastEdited
            : annot.lastEdited.getTime()
    return {
        localId: annot.url,
        remoteId: undefined,
        unifiedListIds: opts.extraData?.unifiedListIds ?? [],
        body: annot.body,
        comment: annot.comment,
        selector: annot.selector,
        creator: opts.extraData?.creator,
        localListIds: opts.excludeLocalLists ? undefined : annot.lists,
        normalizedPageUrl: annot.pageUrl,
        lastEdited,
        createdWhen,
        privacyLevel: shareOptsToPrivacyLvl({
            shouldShare: annot.isShared,
            isBulkShareProtected: annot.isBulkShareProtected,
        }),
        ...(opts.extraData ?? {}),
    }
}

export const reshapeSharedAnnotationForCache = (
    annot: Omit<SharedAnnotationWithRefs, 'creator'>,
    opts: {
        extraData?: Partial<UnifiedAnnotation>
        /** Generally only used test assertions - local list IDs will be mapped to cache IDs internally */
        excludeLocalLists?: boolean
    },
): UnifiedAnnotationForCache => {
    return {
        localId: undefined,
        remoteId: annot.reference.id.toString(),
        unifiedListIds: opts.extraData?.unifiedListIds ?? [],
        body: annot.body,
        comment: annot.comment,
        selector: annot.selector,
        creator: annot.creatorReference,
        localListIds: opts.excludeLocalLists ? undefined : [],
        normalizedPageUrl: annot.normalizedPageUrl,
        lastEdited: annot.updatedWhen,
        createdWhen: annot.createdWhen,
        privacyLevel: AnnotationPrivacyLevels.SHARED,
        ...(opts.extraData ?? {}),
    }
}

// export const reshapeCacheAnnotation = (
//     annot: UnifiedAnnotation & Required<Pick<UnifiedAnnotation, 'localId'>>,
// ): Annotation => ({
//     url: annot.localId,
//     pageUrl: annot.normalizedPageUrl,
//     body: annot.body,
//     comment: annot.comment,
//     selector: annot.selector,
//     isShared: annot.isShared,
//     isBulkShareProtected: annot.isBulkShareProtected,
//     lastEdited: new Date(annot.lastEdited),
//     createdWhen: new Date(annot.createdWhen),
//     lists: [],
//     tags: [],
// })

export const reshapeLocalListForCache = (
    list: PageList,
    opts: {
        hasRemoteAnnotations?: boolean
        extraData?: Partial<UnifiedList>
    },
): UnifiedListForCache => {
    let type: UnifiedList['type'] = 'user-list'
    if (list.type === 'page-link') {
        type = 'page-link'
    } else if (Object.values(SPECIAL_LIST_IDS).includes(list.id)) {
        type = 'special-list'
    }

    return {
        type,
        name: list.name,
        localId: list.id,
        remoteId: list.remoteId,
        creator: opts.extraData?.creator,
        description: list.description,
        unifiedAnnotationIds: [],
        hasRemoteAnnotationsToLoad: !!opts.hasRemoteAnnotations,
        ...(opts.extraData ?? {}),
    }
}

export const reshapeFollowedListForCache = (
    list: FollowedList,
    opts: {
        hasRemoteAnnotations?: boolean
        extraData?: Partial<UnifiedList>
    },
): UnifiedListForCache => ({
    name: list.name,
    // TODO: Are followed page links a thing? If so there's no easy way to distinguish them here
    type: 'user-list',
    localId: undefined,
    remoteId: list.sharedList.toString(),
    creator: { type: 'user-reference', id: list.creator },
    description: undefined,
    unifiedAnnotationIds: [],
    hasRemoteAnnotationsToLoad: !!opts.hasRemoteAnnotations,
    ...(opts.extraData ?? {}),
})

export const getUserAnnotationsArray = (
    cache: Pick<PageAnnotationsCacheInterface, 'annotations'>,
    userId?: string,
): UnifiedAnnotation[] =>
    normalizedStateToArray(cache.annotations).filter(
        (annot) =>
            annot.creator == null ||
            (userId ? annot.creator.id === userId : false),
    )

export const getHighlightAnnotationsArray = (
    cache: Pick<PageAnnotationsCacheInterface, 'annotations'>,
): UnifiedAnnotation[] =>
    normalizedStateToArray(cache.annotations).filter((a) => a.body?.length > 0)

export const getUserHighlightsArray = (
    cache: Pick<PageAnnotationsCacheInterface, 'annotations'>,
    userId?: string,
): UnifiedAnnotation[] =>
    getHighlightAnnotationsArray(cache).filter(
        (annot) =>
            annot.creator == null ||
            (userId ? annot.creator.id === userId : false),
    )

export const getListHighlightsArray = (
    cache: Pick<PageAnnotationsCacheInterface, 'annotations'>,
    listId: UnifiedList['unifiedId'],
): UnifiedAnnotation[] =>
    getHighlightAnnotationsArray(cache).filter((annot) =>
        annot.unifiedListIds.includes(listId),
    )

export const getLocalListIdsForCacheIds = (
    cache: Pick<PageAnnotationsCacheInterface, 'lists'>,
    cacheIds: string[],
): number[] =>
    cacheIds
        .map((listId) => cache.lists.byId[listId]?.localId)
        .filter((id) => id != null)

interface CacheHydratorDeps {
    user?: UserReference
    cache: PageAnnotationsCacheInterface
    bgModules: {
        pageActivityIndicator: RemotePageActivityIndicatorInterface
        contentSharing: ContentSharingInterface
        annotations: AnnotationInterface<'caller'>
        customLists: RemoteCollectionsInterface
    }
}

// NOTE: this is tested as part of the sidebar logic tests
export async function hydrateCacheForSidebar(
    args: CacheHydratorDeps & {
        fullPageUrl: string
    },
): Promise<void> {
    const localListsData = await args.bgModules.customLists.fetchAllLists({})
    const remoteListIds = await args.bgModules.contentSharing.getRemoteListIds({
        localListIds: localListsData.map((list) => list.id),
    })
    const followedListsData = await args.bgModules.pageActivityIndicator.getPageFollowedLists(
        args.fullPageUrl,
        Object.values(remoteListIds),
    )

    await hydrateCacheLists({
        remoteListIds,
        localListsData,
        followedListsData,
        ...args,
    })

    const annotationsData = await args.bgModules.annotations.listAnnotationsByPageUrl(
        {
            pageUrl: args.fullPageUrl,
            withLists: true,
        },
    )

    const annotationUrls = annotationsData.map((annot) => annot.url)
    const privacyLvlsByAnnot = await args.bgModules.contentSharing.findAnnotationPrivacyLevels(
        { annotationUrls },
    )
    const remoteIdsByAnnot = await args.bgModules.contentSharing.getRemoteAnnotationIds(
        { annotationUrls },
    )

    const pageLocalListIds = await args.bgModules.customLists.fetchPageLists({
        url: args.fullPageUrl,
    })

    args.cache.setAnnotations(
        annotationsData.map((annot) => {
            const privacyLevel = privacyLvlsByAnnot[annot.url]

            // Inherit parent page shared lists if public annot
            const unifiedListIds =
                privacyLevel >= AnnotationPrivacyLevels.SHARED
                    ? pageLocalListIds
                          .map((localListId) => {
                              const cachedList = args.cache.getListByLocalId(
                                  localListId,
                              )
                              return cachedList?.remoteId != null
                                  ? cachedList.unifiedId
                                  : null
                          })
                          .filter((id) => id != null)
                    : undefined

            return reshapeAnnotationForCache(annot, {
                extraData: {
                    remoteId: remoteIdsByAnnot[annot.url]?.toString(),
                    creator: args.user,
                    unifiedListIds,
                    privacyLevel,
                },
            })
        }),
    )

    args.cache.setPageData(
        normalizeUrl(args.fullPageUrl),
        pageLocalListIds.map(
            (localListId) =>
                args.cache.getListByLocalId(localListId)?.unifiedId,
        ),
    )
}

export async function hydrateCacheForDashboard(
    args: CacheHydratorDeps,
): Promise<void> {
    const localListsData = await args.bgModules.customLists.fetchAllLists({
        includeDescriptions: true,
        skipSpecialLists: true,
    })
    const remoteListIds = await args.bgModules.contentSharing.getRemoteListIds({
        localListIds: localListsData.map((list) => list.id),
    })
    const followedListsData = await args.bgModules.pageActivityIndicator.getAllFollowedLists()

    await hydrateCacheLists({
        remoteListIds,
        localListsData,
        followedListsData,
        ...args,
    })
}

async function hydrateCacheLists(
    args: {
        localListsData: PageList[]
        remoteListIds: { [localListId: number]: string }
        followedListsData: {
            [remoteListId: string]: Pick<
                FollowedList,
                'sharedList' | 'creator' | 'name' | 'type'
            > &
                Partial<Pick<FollowedListEntry, 'hasAnnotationsFromOthers'>>
        }
    } & CacheHydratorDeps,
): Promise<void> {
    // Get all the IDs of page link lists
    const pageLinkListIds = new Set<string>()
    for (const list of Object.values(args.followedListsData)) {
        if (list.type === 'page-link') {
            pageLinkListIds.add(list.sharedList.toString())
        }
    }
    for (const list of args.localListsData) {
        const remoteId = args.remoteListIds[list.id]
        if (remoteId != null && list.type === 'page-link') {
            pageLinkListIds.add(remoteId)
        }
    }

    // Look up shared list entry data for all the page link lists to be able to get them to the cache
    const sharedListEntryMap = new Map<
        string,
        { entryId: string; pageTitle: string }
    >()
    if (pageLinkListIds.size) {
        const followedEntriesByList = await args.bgModules.pageActivityIndicator.getEntriesForFollowedLists(
            [...pageLinkListIds],
            { sortAscByCreationTime: true },
        )
        for (const entries of Object.values(followedEntriesByList)) {
            if (entries.length) {
                sharedListEntryMap.set(entries[0].followedList.toString(), {
                    entryId: entries[0].sharedListEntry.toString(),
                    pageTitle: entries[0].entryTitle,
                })
            }
        }
    }

    const seenFollowedLists = new Set<AutoPk>()

    const listsToCache = args.localListsData.map((list) => {
        let creator = args.user
        let hasRemoteAnnotations = false
        const remoteId = args.remoteListIds[list.id]
        const sharedListEntryData =
            list.type === 'page-link'
                ? sharedListEntryMap.get(remoteId) ?? undefined
                : undefined
        if (remoteId != null && args.followedListsData[remoteId]) {
            seenFollowedLists.add(args.followedListsData[remoteId].sharedList)
            hasRemoteAnnotations =
                args.followedListsData[remoteId].hasAnnotationsFromOthers
            creator = {
                type: 'user-reference',
                id: args.followedListsData[remoteId].creator,
            }
        }
        return reshapeLocalListForCache(list, {
            hasRemoteAnnotations,
            extraData: {
                sharedListEntryId: sharedListEntryData?.entryId,
                pageTitle: sharedListEntryData?.pageTitle,
                remoteId,
                creator,
            },
        })
    })

    // Ensure we cover any followed-only lists (lists with no local data)
    Object.values(args.followedListsData)
        .filter((list) => !seenFollowedLists.has(list.sharedList))
        .forEach((list) => {
            const sharedListEntryData =
                list.type === 'page-link'
                    ? sharedListEntryMap.get(list.sharedList.toString()) ??
                      undefined
                    : undefined
            listsToCache.push(
                reshapeFollowedListForCache(list, {
                    hasRemoteAnnotations: list.hasAnnotationsFromOthers,
                    extraData: {
                        sharedListEntryId: sharedListEntryData?.entryId,
                        pageTitle: sharedListEntryData?.pageTitle,
                    },
                }),
            )
        })

    args.cache.setLists(listsToCache)
}

export function deriveListOwnershipStatus(
    listData: UnifiedList,
    currentUser?: UserReference,
): 'Creator' | 'Follower' | 'Contributor' {
    if (listData.remoteId != null && listData.localId == null) {
        return 'Follower'
    }

    if (
        listData.remoteId != null &&
        listData.localId != null &&
        listData.creator?.id !== currentUser?.id
    ) {
        return 'Contributor'
    }

    return 'Creator'
}

export type UnifiedListsByCategories = {
    myLists: UnifiedList<'user-list' | 'special-list'>[]
    joinedLists: UnifiedList<'user-list'>[]
    followedLists: UnifiedList<'user-list'>[]
    pageLinkLists: UnifiedList<'page-link'>[]
}

export function siftListsIntoCategories(
    lists: UnifiedList[],
    currentUser?: UserReference,
): UnifiedListsByCategories {
    const categories: UnifiedListsByCategories = {
        myLists: [],
        joinedLists: [],
        followedLists: [],
        pageLinkLists: [],
    }
    for (const list of lists) {
        const ownership = deriveListOwnershipStatus(list, currentUser)
        if (list.type === 'page-link') {
            categories.pageLinkLists.push(list)
        } else if (ownership === 'Creator') {
            categories.myLists.push(list)
        } else if (ownership === 'Follower' && !list.isForeignList) {
            categories.followedLists.push(list as any)
        } else if (ownership === 'Contributor') {
            categories.joinedLists.push(list as any)
        }
    }
    return categories
}
